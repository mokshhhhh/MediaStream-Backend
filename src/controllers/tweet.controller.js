import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(400, "tweet cannot be empty");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "failed to create a tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "Tweet created successfully"));
});

const getTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    throw new ApiError(400, " User ID is required");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        content: 1,
        owner : 1,
        createdAt: 1,
      },
    },
  ]);

  if (tweets.length === 0) {
    throw new ApiError(404, "No tweets could be fetched from this user / empty ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched succesfully"));
});

const editTweets = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(400, "Tweet Id is required");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "New content is required");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to edit this tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweets = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  
  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getTweets, editTweets, deleteTweets };
