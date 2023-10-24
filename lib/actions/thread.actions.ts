"use server";

import { revalidatePath } from "next/cache";

import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

interface createThreadProps {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export const createThread = async ({
  text,
  author,
  communityId,
  path,
}: createThreadProps) => {
  try {
    connectToDB();

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread.id },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(
      `Error creating thread ${error.messsage}`
    );
  }
};

export const fetchPosts = async (
  pageNumber = 1,
  pageSize = 20
) => {
  connectToDB();

  const skipAmount = (pageNumber - 1) * pageSize;

  const postsQuery = Thread.find({
    parentId: { $in: [null, undefined] },
  })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: "author", model: User })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    });

  const totalPostsCount =
    await Thread.countDocuments({
      $in: [null, undefined],
    });

  const posts = await postsQuery.exec();

  const isNext =
    totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
};

export const fetchThreadById = async (
  id: string
) => {
  connectToDB();

  //TODO Populate communities
  try {
    const thread = await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id name parentId image",
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id name parentId image",
            },
          },
        ],
      })
      .exec();

    return thread;
  } catch (error: any) {
    throw new Error(
      `Error fetching thread ${error.message}`
    );
  }
};

export const addCommentToThread = async (
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) => {
  connectToDB();

  try {
    const originalThread = await Thread.findById(
      threadId
    );

    if (!originalThread) {
      throw new Error("Could not find thread");
    }

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    const savedCommentThread =
      await commentThread.save();

    originalThread.children.push(
      savedCommentThread._id
    );

    await originalThread.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(
      `Error adding comment to thread: ${error.message}`
    );
  }
};
