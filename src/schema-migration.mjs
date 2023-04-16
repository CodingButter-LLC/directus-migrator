import path from "path"

let configArray

export const config = async (config = { path: "directus-migrator.config.mjs" }) => {
  const configPath = `${path.join(process.cwd(), config.path)}`
  if (!configArray) {
    const config = await import(`${configPath}`)
    configArray = config.default
  }
  return configArray
}

export async function schemaMigrate(source, target, force = false) {
  //check if source is a string
  if (typeof source === "string") {
    await config()
    if (!configArray) throw new Error("Config not found")
    source = configArray.find((config) => config.name === source)
    target = configArray.find((config) => config.name === target)
    if (!source || !target) throw new Error("Source or target not found in config")
  }
  try {
    const snapshot = await getSnapshot(source)
    const diff = await getDiff(target, snapshot, force)
    if (!diff) return { status: "no changes" }
    const applied = await applyDiff(target, diff)
    if (!applied) return { status: "failed" }
    return { status: "success" }
  } catch (err) {
    console.error("Migration Failed: Are you sure there are changes to be made?", err)
  }
}

export async function getSnapshot({ endpoint, accessToken }) {
  const URL = `${endpoint}/schema/snapshot?access_token=${accessToken}`
  const { data } = await fetch(URL).then((r) => r.json())
  return data
}

export async function getDiff({ endpoint, accessToken }, snapshot, force) {
  const URL = `${endpoint}/schema/diff?access_token=${accessToken}${force ? "&force=true" : ""}}`
  const response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify(snapshot),
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (response.ok) {
    console.log("Migration Diff Successful")
    const jsonResponse = await response.json()
    return jsonResponse.data
  } else {
    console.warn("Migration Diff Failed")
    return false
  }
}

export async function applyDiff({ endpoint, accessToken }, diff) {
  const URL = `${endpoint}/schema/apply?access_token=${accessToken}`
  const response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify(diff),
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (response.ok) {
    console.log("Migration Successful")
    return true
  } else {
    console.warn("Migration Failed")
    return false
  }
}
