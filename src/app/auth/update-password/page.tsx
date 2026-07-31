'use client'

import { useEffect } from "react"

export default function UpdatePasswordPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const hash = window.location.hash

    let target = "/auth/reset-password"
    if (code) target += `?code=${encodeURIComponent(code)}`
    if (hash) target += hash

    window.location.replace(target)
  }, [])

  return null
}
