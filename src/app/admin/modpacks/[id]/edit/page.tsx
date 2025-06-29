import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "~/lib/utils/admin-utils";
import { getModpackById } from "~/server/actions/modpacks";
import { EditModpackForm } from "./edit-form";

interface EditModpackPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditModpackPage({
  params,
}: EditModpackPageProps) {
  const { id } = await params;

  try {
    await requireAdmin();
  } catch {
    redirect("/modpacks?error=admin_required");
  }

  const result = await getModpackById(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const modpack = result.data;

  return <EditModpackForm params={{ id }} modpack={modpack} />;
}
