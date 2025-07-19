import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    // If user is null here, something is wrong with the ID or finding the user.
    if (!user) {
      // This shouldn't happen based on your previous logs, but good to have
      throw new ApiError(
        404,
        "User not found for token generation inside generateTokens"
      );
    }

    const accessToken = user.generateAccessToken(); // This is a prime suspect line
    const refreshToken = user.generateRefreshToken(); // This is another prime suspect line

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // This is also a strong suspect line
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation and handling
  //if user already exists
  //check for images, check for avatar
  //upload to cloudinary
  //create user as object - create entry in idb
  //remove pswd and refresh token from response
  //check for user creation and return response

  const { fullname, email, username, password } = req.body; //from postman currently

  //empty
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //existing user
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath=req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  //image can be huge so await used

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar image required");
  }
  //create user
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong, user not registered");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take data from req->body
  // username or email
  // find user and then check password
  //access and refresh token
  // send cookies , send response that login successful

  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("User object found:", user);
  console.log(
    "Does user have generateAccessToken?",
    typeof user.generateAccessToken
  );
  console.log(
    "Does user have generateRefreshToken?",
    typeof user.generateRefreshToken
  );

  if (!user) {
    throw new ApiError(404, "username doesnt exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  //dont want to send pswd or refreshTokens to user
  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined, //Functionality for logging out
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logget out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  // to see if user can continue being logged in the session even after refresh token has been expired
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized access/ request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid resfresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token expired or already used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = User.findById(req.user?._id);
  const isPasswordCorrect = await isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!(fullname || email)) {
    throw new ApiError(400, "all fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email, //same thing
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(401, "avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(401, "errow while updating avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const localCoverImage = req.file?.path;

  if (!localCoverImage) {
    throw new ApiError(401, "error in fetching cover image");
  }

  const coverImage = await uploadOnCloudinary(localCoverImage);

  if (!coverImage.url) {
    throw new ApiError(401, "error while uploading coverimage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully"));
});

//aggregation pipeline
const getUserChannel = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  // {},{},{} ->diff stages in aggregate pipeline
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      //for no of subscribers
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      //for ppl ive (channel) subsribed
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subsribersCount: {
          $size: "$subscribers",
        },

        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },

        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $project: {
        fullname: 1,
        email: 1,
        username: 1,
        subsribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel doesn not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

//for fetching watch history
const fetchWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields:{ //to make work easier in frontned , we fetch arr[0] element but owner field contains the first element directly
              owner:{
                $first:"$owner"
              }
            }
            
          }
        ],
      },
    },
  ]);
   return res
   .status(200)
   .json(new ApiResponse(200,
      user[0].watchHistory,
      "Watch History fetched successfully"
   ))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannel,
  fetchWatchHistory,
};
