import { redirect } from "next/navigation";

/* The prototype started at "/" before the two sites were split into
   /candidate and /employer, so the root URL keeps working. */
export default function Page() {
  redirect("/candidate");
}

