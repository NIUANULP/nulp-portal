export function replaceDomain(obj: any) {
  const oldDomain = "https://nulpstorage1.blob.core.windows.net";
  const newDomain = "https://nulpstorage.blob.core.windows.net";

  if (!obj || typeof obj !== "object") return obj;

  if (typeof obj === "string" && obj.includes(oldDomain)) {
    return obj.replace(oldDomain, newDomain);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => this.replaceDomain(item));
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, this.replaceDomain(value)])
  );
}
