import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

const getImageUrl = (id: string) => `https://picsum.photos/seed/${id}/960/560`;

const Home: NextPage = () => {
  const { data: session } = useSession();
  const { data: posts } = trpc.post.getAll.useQuery();
  const router = useRouter();

  const featuredPost = posts?.at(0);
  const otherPosts = posts?.slice(1);

  const createPost = trpc.post.createPost.useMutation();
  const handleCreateNewPost = async () => {
    const newPost = await createPost.mutateAsync({ title: "New Post", content: "This is a new post" });
    router.push(`/posts/${newPost.id}/edit`);
  };

  return (
    <>
      <Head>
        <title>Blog | Dirk S Beukes</title>
        <meta name="description" content="A quick website to write down all Dirk's ideas" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-light p-8">
        <nav className="mx-auto flex max-w-8xl justify-between">
          {session?.user ? (
            <Image src={session?.user?.image || "/fallback.webp"} width={40} height={40} className="rounded-full" alt="Profile Image" />
          ) : (
            <Link href="/api/auth/signin">Sign In</Link>
          )}
          <ul className="flex gap-8 text-sm font-medium text-secondary">
            <li>Home</li>
            <li className="text-accent underline underline-offset-8">Blog</li>
            <li>Scratches</li>
            <li>Projects</li>
          </ul>
        </nav>
        <article className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-2 md:px-20 xl:grid-cols-3">
          <div className="mt-8 flex justify-between md:col-span-2 md:mb-4 xl:col-span-3">
            <h1 className="text-7xl font-bold text-primary   md:text-8xl  xl:text-9xl">The Blog</h1>
            {session?.user?.admin && (
              <button className="text-sm font-medium text-secondary hover:text-accent" onClick={handleCreateNewPost}>
                New
              </button>
            )}
          </div>
          {featuredPost && (
            <Link
              href={`/posts/${featuredPost?.id}`}
              className="flex grid-cols-5 flex-col gap-8 rounded-xl p-4 duration-100 hover:bg-slate-300 md:col-span-2 xl:col-span-3 xl:grid"
            >
              <Image
                src={getImageUrl(featuredPost.id) || "/fallback.webp"}
                width={960}
                height={560}
                className="col-span-3 h-full rounded-lg"
                alt="Featured Post Image"
                priority
              />
              <div className="col-span-2 flex flex-col justify-between gap-4">
                <span className="text-sm font-medium text-dark">
                  {featuredPost?.author?.name?.split(" ").at(0)} {featuredPost?.createdAt.toDateString()}
                </span>
                <h1 className="text-5xl font-medium text-primary xl:text-7xl">{featuredPost?.title}</h1>
                <p className="">
                  {featuredPost?.content && featuredPost.content.length > 120 ? featuredPost?.content.slice(0, 117) + "..." : featuredPost?.content}
                </p>
              </div>
            </Link>
          )}
          {otherPosts?.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="flex flex-col gap-4 rounded-lg p-4 duration-100 hover:bg-slate-300">
              <Image src={getImageUrl(post.id) || "/fallback.webp"} width={960} height={560} className="rounded-lg" alt="Featured Post Image" />
              <span className="text-sm font-medium text-dark">
                {post.author.name?.split(" ").at(0)} {post.createdAt.toDateString()}
              </span>
              <h1 className="text-4xl font-medium leading-none">{post.title}</h1>
              <p className="">{post.content && post.content.length > 120 ? post.content.slice(0, 117) + "..." : post.content}</p>
            </Link>
          ))}
        </article>
      </main>
    </>
  );
};

import { createContextInner } from "../server/trpc/context";
import { appRouter } from "../server/trpc/router/_app";
import superjson from "superjson";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";

export const getStaticProps = async () => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  await ssg.post.getAll.prefetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 120,
  };
};

export default Home;
