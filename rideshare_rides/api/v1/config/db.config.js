module.exports = {
    HOST: process.env.DB_SERVER || "localhost",
    USER: process.env.DB_USERNAME || "root",
    PASSWORD: process.env.DB_PASSWORD || "",
    DB: process.env.DB_DATABASE || "rideshare_rides"
};
