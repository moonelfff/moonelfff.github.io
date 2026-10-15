export type DataProvider = "supabase" | "mysql";

export function getDataProvider(): DataProvider {
  const provider = process.env.DATA_PROVIDER ?? "supabase";
  if (provider !== "supabase" && provider !== "mysql") {
    throw new Error("DATA_PROVIDER must be supabase or mysql");
  }
  return provider;
}
