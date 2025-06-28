import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
 
const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        //User is mongoose db linked while user is our own logic 
        const user=await User.findOne(userId)
        const accessToken=user.generateAcessToken()
        const refreshToken=user.generateRefreshToken()
        //access tokens can be showed to user but refresh tokens are long lived 
        // so needs to be sent to db
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave : false}) // done so that pswd field which is reqd in user.model is bypassed

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong whilst generating access and refresj tokens")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
 
    //get user details from frontend 
    //validation and handling
    //if user already exists
    //check for images, check for avatar
    //upload to cloudinary
    //create user as object - create entry in idb
    //remove pswd and refresh token from response
    //check for user creation and return response

const {fullname, email ,username , password} =req.body //from postman currently

    //empty
    if(
        [fullname,email,username,password].some((field)=>field?. trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }
    //existing user
   const existingUser= await User.findOne({
        $or:[{ email }, { username }]
    })
    if(existingUser){
        throw new ApiError(409, "User already exists with this email or username");
    }

    const avatarLocalPath=req.files?.avatar[0]?.path
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }
    //image can be huge so await used 

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar image required");
    }
    //create user
    const user =await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"something went wrong, user not registered")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )

})

const loginUser=asyncHandler(async(req,res)=>{
    // take data from req->body 
    // username or email 
    // find user and then check password
    //access and refresh token 
    // send cookies , send res that login successful 

    const {email,username,password}=req.body
    if(!username || !email){
        throw new ApiError(400, "Username or email is required");
    }
    
    const user= await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"username doesnt exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken, refreshToken} =await generateAccessAndRefreshTokens(user._id)
    
    //dont want to send pswd or refreshTokens to user
    const loggedUser=User.findById(user._id).select("-password -refreshToken")
    
    const options={
        httpOnly: true,
        secure:true
    }
     
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedUser, accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser=asyncHandler(async=>(req,res)=>{
    
})


export { registerUser ,loginUser}