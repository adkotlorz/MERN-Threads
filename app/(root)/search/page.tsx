import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import {
  fetchUser,
  fetchUsers,
} from "@/lib/actions/user.actions";

import { UserCard } from "@/components/cards";
import {
  Pagination,
  Searchbar,
} from "@/components/shared";

const Page = async ({
  searchProps,
}: {
  searchProps: {
    [key: string]: string | undefined;
  };
}) => {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded)
    redirect("/onboarding");

  const result = await fetchUsers({
    userId: user.id,
    searchString: "",
    pageNumber: 1,
    pageSize: 25,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Search</h1>

      <Searchbar routeType="/search" />

      <div className="mt-14 flex flex-col gap-9">
        {result.users.length === 0 ? (
          <p className="no-result">No users</p>
        ) : (
          <>
            {result.users.map((person) => (
              <UserCard
                key={person.id}
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType="User"
              />
            ))}
          </>
        )}
      </div>
      <Pagination
        path="search"
        pageNumber={
          searchProps?.page
            ? +searchProps.page
            : 1
        }
        isNext={result.isNext}
      />
    </section>
  );
};

export default Page;
