import { describe, it, expect, beforeEach } from "vitest"
import { getSession, isLoggedIn, getUserRole, getUserRoles, logout, ROLE_HIERARCHY } from "@/lib/auth"

beforeEach(() => {
  window.localStorage.clear()
})

describe("auth - localStorage cache", () => {
  it("getSession returns null when no session", () => {
    expect(getSession()).toBeNull()
  })

  it("getSession returns parsed session from localStorage", () => {
    const session = { email: "test@test.com", name: "Test", id: "123" }
    window.localStorage.setItem("zafiro_session", JSON.stringify(session))
    expect(getSession()).toEqual(session)
  })

  it("isLoggedIn returns false when no session", () => {
    expect(isLoggedIn()).toBe(false)
  })

  it("isLoggedIn returns true when session exists", () => {
    window.localStorage.setItem("zafiro_session", JSON.stringify({ email: "a@b.com", name: "A", id: "1" }))
    expect(isLoggedIn()).toBe(true)
  })
})

describe("auth - roles", () => {
  it("getUserRoles returns customer by default", () => {
    expect(getUserRoles()).toEqual(["customer"])
  })

  it("getUserRoles returns parsed roles from localStorage", () => {
    window.localStorage.setItem("zafiro_user_roles", JSON.stringify(["admin", "vip"]))
    expect(getUserRoles()).toEqual(["admin", "vip"])
  })

  it("getUserRole returns highest role", () => {
    window.localStorage.setItem("zafiro_user_roles", JSON.stringify(["customer", "admin", "vip"]))
    expect(getUserRole()).toBe("admin")
  })

  it("ROLE_HIERARCHY has correct order", () => {
    expect(ROLE_HIERARCHY.superadmin).toBeGreaterThan(ROLE_HIERARCHY.admin)
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.customer)
  })
})

describe("auth - logout", () => {
  it("logout clears session and roles", async () => {
    window.localStorage.setItem("zafiro_session", JSON.stringify({ email: "a@b.com", name: "A", id: "1" }))
    window.localStorage.setItem("zafiro_user_roles", JSON.stringify(["admin"]))
    await logout()
    expect(window.localStorage.getItem("zafiro_session")).toBeNull()
    expect(window.localStorage.getItem("zafiro_user_roles")).toBeNull()
  })
})
