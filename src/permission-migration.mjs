export async function getPermissions({ endpoint, accessToken }) {
  const URL = `${endpoint}/permissions?access_token=${accessToken}`
  const { data } = await fetch(URL).then((r) => r.json())
  return data
}

export async function migrate(source, target, force = false) {
  try {
    const sourcePermissions = await getPermissions(source)
    console.log(JSON.stringify(sourcePermissions, null, 2))
  } catch (err) {
    console.log("Migration Failed: Are you sure there are changes to be made?", err)
  }
}
