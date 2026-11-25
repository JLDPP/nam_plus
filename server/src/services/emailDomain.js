import { Resolver } from "node:dns/promises";

const resolver = new Resolver({ timeout: 2400, tries: 1 });
const missingRecord = new Set(["ENODATA", "ENOTFOUND"]);
const reservedDomain = /(?:^|\.)(?:example|invalid|localhost|test|local)$/i;

export async function mailDomainStatus(email, dns = resolver) {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (!domain.includes(".") || reservedDomain.test(domain)) return "invalid";

  try {
    const records = await dns.resolveMx(domain);
    if (records.length > 0) {
      // Un MX nulo expresa que el dominio no acepta correo.
      return records.some(({ exchange }) => exchange && exchange !== ".") ? "valid" : "invalid";
    }
  } catch (error) {
    if (error.code === "ENOTFOUND") return "invalid";
    if (error.code !== "ENODATA") return "unavailable";
  }

  // SMTP permite entregar al propio dominio cuando no publica un registro MX.
  const alternatives = await Promise.allSettled([dns.resolve4(domain), dns.resolve6(domain)]);
  if (alternatives.some((record) => record.status === "fulfilled" && record.value.length > 0)) return "valid";
  return alternatives.some((record) => record.status === "rejected" && !missingRecord.has(record.reason?.code))
    ? "unavailable" : "invalid";
}
