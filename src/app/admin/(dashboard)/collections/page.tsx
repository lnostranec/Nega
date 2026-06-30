import { redirect } from "next/navigation";

export default function AdminCollectionsRedirect() {
  redirect("/admin/categories");
}
