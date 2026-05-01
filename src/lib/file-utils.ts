export async function iconUrlFromForm(form: FormData) {
  const file = form.get("icon");
  if (!(file instanceof File) || file.size === 0) return undefined;

  if (file.size > 500_000) {
    throw new Error("Icon image must be under 500 KB.");
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read icon image."));
    reader.readAsDataURL(file);
  });
}

export default iconUrlFromForm;
