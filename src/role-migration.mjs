export async function getRoles({ endpoint, accessToken }) {
  const URL = `${endpoint}/roles?access_token=${accessToken}`
  const { data } = await fetch(URL).then((r) => r.json())
  return data
}

export async function roleMigrate(source, target, force = false) {
  try {
    const sourceRoles = await getRoles(source)
    console.log(sourceRoles)
  } catch (err) {
    console.log("Migration Failed: Are you sure there are changes to be made?", err)
  }
}
