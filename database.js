// import mysql from 'mysql2'
// import dotenv from 'dotenv'
// dotenv.config()

// var solution = ''

// const overview = () => {
//     const connection = mysql.createConnection({
//         host: process.env.MY_HOST,
//         user: process.env.MY_USER,
//         password: process.env.MY_PASSWORD,
//         database: process.env.MY_DATABASE_FITNESS,
//     });
//     connection.connect();
//     connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//         if (error) throw error;
//         solution = ('The solution is: ', results[0].solution);
//     });

//     connection.end()

//     return solution
// }

// export default overview