export const errorHandler = (error, req, res, next) => {
    if (error.status) {
        res.status(error.status).json({msg: error.message});
    }
    else {
        res.status(500).json({msg: error.message});
    }
}