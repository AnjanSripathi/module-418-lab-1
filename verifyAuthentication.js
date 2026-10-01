const jwt = require("jsonwebtoken");
// Verifying the token that was sent in the request by the client; specifically a Bearer <token>
function verifyAuthentication(req,res,next){
    try{
        let token = req.headers.authorization;
        if(!token || !token.startsWith("Bearer ")){
            return res.status(401).json({message: "No bearer token or incorrect format. Authentication denied."});
        }
        token = token.split(" ")[1]; // Split the Bearer and consider the key only 
        const decodedPayload = jwt.verify(token,process.env.JWT_SECRET);
        console.log(decodedPayload);
        req.user = decodedPayload;
        next();
    }
    catch(error){
        console.error(error);
        res.status(401).json({message:"Token is invalid..."});
    }
}

module.exports = verifyAuthentication;