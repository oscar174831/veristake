type VercelEnvResponse = {
  error?: { message?: string };
};

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const token = process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID || argValue("--project-id");
  const teamId = process.env.VERCEL_ORG_ID || argValue("--team-id");
  const value =
    process.env.NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON || argValue("--addresses-json");

  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON or --addresses-json.");
  }

  if (!token || !projectId) {
    const curl = [
      "curl -X POST",
      `"https://api.vercel.com/v10/projects/${projectId || "$VERCEL_PROJECT_ID"}/env${teamId ? `?teamId=${teamId}` : "?teamId=$VERCEL_ORG_ID"}"`,
      '-H "Authorization: Bearer $VERCEL_API_TOKEN"',
      '-H "Content-Type: application/json"',
      `-d '${JSON.stringify({
        key: "NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON",
        value,
        type: "plain",
        target: ["production", "preview"]
      })}'`
    ].join(" ");
    console.log("Missing VERCEL_API_TOKEN or VERCEL_PROJECT_ID. Run manually:");
    console.log(curl);
    return;
  }

  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/env`);
  if (teamId) url.searchParams.set("teamId", teamId);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      key: "NEXT_PUBLIC_VERISTAKE_PROD_DEPLOYMENT_ADDRESSES_JSON",
      value,
      type: "plain",
      target: ["production", "preview"]
    })
  });
  const json = (await response.json().catch(() => ({}))) as VercelEnvResponse;
  if (!response.ok) {
    throw new Error(json.error?.message || `Vercel API failed with HTTP ${response.status}`);
  }
  console.log("Vercel production address env var created.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
