// src/utils/storageUtils.js
export function saveToLocalStorage(key, value, expiryInHours = 24) {
    const now = new Date()
    const item = {
        value: value,
        expiry: now.getTime() + expiryInHours * 60 * 60 * 1000,
    }
    localStorage.setItem(key, JSON.stringify(item))
}

export function getFromLocalStorage(key) {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item = JSON.parse(itemStr)
    const now = new Date()

    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key)
        return null
    }
    return item.value
}