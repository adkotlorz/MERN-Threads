import { PostThread } from "@/components/forms";

import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

async function Page() {
  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded)
    redirect("/onboarding");

  const userId = userInfo._id;

  return (
    <>
      <h1 className="head-text">Create thread</h1>
      <PostThread userId={userId} />
    </>
  );
}

export default Page;
