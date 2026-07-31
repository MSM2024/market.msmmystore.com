import { bibliotecaRepo } from "./repository"
import type { LibrarySource, LibraryBook, LibraryImportJob } from "./types"

interface DriveFileInfo {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  createdTime: string
  size?: string
  parents?: string[]
  description?: string
  md5Checksum?: string
  webViewLink?: string
  ownedByMe?: boolean
}

interface DriveFolderInfo {
  id: string
  name: string
}

export class GoogleDriveSyncService {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private folderId: string | null = null
  private isAuthorized = false

  setTokens(accessToken: string, refreshToken?: string): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken || null
    this.isAuthorized = true
  }

  setFolderId(folderId: string): void {
    this.folderId = folderId
  }

  isReady(): boolean {
    return this.isAuthorized && !!this.folderId
  }

  clearAuth(): void {
    this.accessToken = null
    this.refreshToken = null
    this.isAuthorized = false
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
    if (!this.accessToken) return null
    const url = new URL(`https://www.googleapis.com/drive/v3/${endpoint}`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  async connect(sourceId?: string): Promise<boolean> {
    if (sourceId) {
      const sources = await bibliotecaRepo.getSources()
      const source = sources.find(s => s.id === sourceId) as LibrarySource | null
      if (source?.config) {
        const config = source.config as Record<string, string>
        this.folderId = config.folderId || null
      }
    }
    return this.isReady()
  }

  async scanFolder(folderId?: string): Promise<DriveFileInfo[]> {
    const targetFolder = folderId || this.folderId
    if (!targetFolder || !this.accessToken) return []
    const result = await this.request<{ files: DriveFileInfo[] }>("files", {
      q: `'${targetFolder}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,modifiedTime,createdTime,size,description,md5Checksum,webViewLink,ownedByMe)",
      orderBy: "folder,name",
      pageSize: "100",
    })
    return result?.files || []
  }

  async scanAllFoldersRecursive(folderId?: string): Promise<DriveFileInfo[]> {
    const targetFolder = folderId || this.folderId
    if (!targetFolder || !this.accessToken) return []
    const allFiles: DriveFileInfo[] = []
    const foldersToScan = [targetFolder]
    const scanned = new Set<string>()

    while (foldersToScan.length > 0) {
      const currentFolder = foldersToScan.shift()!
      if (scanned.has(currentFolder)) continue
      scanned.add(currentFolder)

      const result = await this.request<{ files: DriveFileInfo[] }>("files", {
        q: `'${currentFolder}' in parents and trashed = false`,
        fields: "files(id,name,mimeType,modifiedTime,createdTime,size,description,md5Checksum,webViewLink,ownedByMe)",
        pageSize: "100",
      })

      if (result?.files) {
        for (const file of result.files) {
          if (file.mimeType === "application/vnd.google-apps.folder") {
            foldersToScan.push(file.id)
          } else {
            allFiles.push(file)
          }
        }
      }
    }

    return allFiles
  }

  async getFileContent(fileId: string): Promise<string | null> {
    if (!this.accessToken) return null
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      )
      if (!res.ok) return null
      return await res.text()
    } catch {
      return null
    }
  }

  async getFileAsMarkdown(fileId: string): Promise<string | null> {
    if (!this.accessToken) return null
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/markdown`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      )
      if (!res.ok) return null
      return await res.text()
    } catch {
      return null
    }
  }

  isOwnWork(file: DriveFileInfo): boolean {
    return file.ownedByMe !== false
  }

  matchesAuthor(file: DriveFileInfo, authorKeywords: string[]): boolean {
    const name = file.name.toLowerCase()
    return authorKeywords.some(k => name.includes(k))
  }

  isExcludedType(file: DriveFileInfo): boolean {
    const excludedMimes = [
      "application/vnd.google-apps.form",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.google-apps.map",
      "application/vnd.google-apps.drawing",
    ]
    const excludedNames = [
      "declaracion", "impuesto", "tax", "bank", "password", "token", "key",
      "carnet", "identidad", "passport", "medical", "doctor", "recipe",
    ]
    if (excludedMimes.includes(file.mimeType)) return true
    const name = file.name.toLowerCase()
    return excludedNames.some(e => name.includes(e))
  }

  async importDriveFileToLibrary(
    file: DriveFileInfo,
    metadata: Partial<LibraryBook>
  ): Promise<ImportFileResult> {
    const isDoc = file.mimeType === "application/vnd.google-apps.document"
    const content = isDoc
      ? await this.getFileContent(file.id)
      : null

    if (!content) {
      return { success: false, error: "Could not read file content" }
    }

    const book: Partial<LibraryBook> = {
      drive_file_id: file.id,
      title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
      normalized_title: (metadata.title || file.name.replace(/\.[^/.]+$/, "")).toLowerCase(),
      author: metadata.author || "Miguel Soria Martínez",
      work_type: metadata.work_type || "book",
      series: metadata.series,
      volume_number: metadata.volume_number,
      format: file.mimeType,
      source_url: file.webViewLink,
      modification_date: file.modifiedTime,
      checksum: file.md5Checksum,
      status: "descubierto",
      privacy_level: metadata.privacy_level || "interno_eliana",
      tags: metadata.tags || [],
    }

    const chapters = [{ number: 1, title: "Contenido completo", content }]
    const { bibliotecaIndexer } = await import("./search")
    const result = await bibliotecaIndexer.importBook(book, chapters)

    if (result) {
      return { success: true, bookId: result.bookId, chapters: result.chaptersCreated, chunks: result.chunksCreated }
    }
    return { success: false, error: "Failed to import book" }
  }
}

export interface ImportFileResult {
  success: boolean
  bookId?: string
  chapters?: number
  chunks?: number
  error?: string
}

export const driveSyncService = new GoogleDriveSyncService()
