export function extractGoogleDriveId(input: string) {
    if (!input) return "";
    const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : input.trim();
}
