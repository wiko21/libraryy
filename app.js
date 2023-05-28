const http = require('http');
const fs = require('fs');
const mysql = require('mysql');
const { createPool } = require('mysql');
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const { log } = require('console');
const port = 6060

app.use('/style.css',express.static(__dirname +'/style.css'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = createPool({
    host: 'localhost',
    user: "root",
    password: "root123",
    connectionLimit: 10
});

const connection = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "root123",
    database: 'nodejs'
});
app.get('/book', (req, res) => {
    query = `SELECT books.id, 
    books.title AS title, 
    author.firstlast_name AS author, 
    genre.genre AS genre, 
    books.issue_date,
    books.avalaible, 
    books.amount,
    books.cover
    FROM books
    LEFT JOIN author
    ON books.author = author.id
    LEFT JOIN genre
    ON books.genre = genre.id;
    `
    connection.query(query, (err, results) => {
      if (err){
        throw err;
      }else{
          results = results.map(result => {
            result.issue_date = new Date(result.issue_date).toLocaleDateString();
            return result;
          });
          connection.query(`select firstlast_name from author ORDER BY firstlast_name ASC`, (err, result) => {
            if (err) {
              throw err;
            } else {
              const authors = result.map(author => `<option>${author.firstlast_name}</option>`).join('');
              const dropdown = `
                <div class="dropdown">
                    <label for="bookAuthor">Authors:</label>
                    <select name="bookAuthor" id="myDropdown">
                      ${authors}
                    </select>
                  </div>
              `;
              const html = res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.write(`<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="style.css">
            <title>Books</title>
        </head>
        <body id="body">
            <h1>Books</h1>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Genre</th>
                        <th>Issue Date</th>
                        <th>Available</th>
                        <th>Amount</th>
                        <th>Cover</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                      ${results.map(result => `
                      <tr>
                          <td>${result.title}</td>
                          <td>${result.author}</td>
                          <td>${result.genre}</td>
                          <td>${result.issue_date}</td>
                          <td>${result.avalaible}</td>
                          <td>${result.amount}</td>
                          <td>${result.cover}</td>
                          <td><button><a href="/delete-book?id=${result.id}" class="delbut" >Delete</a></button></td>
                      </tr>
                      `).join('')}
                </tbody>
            </table>              
              <form id="form" method="POST" action="/book">
                <h2>Add Book:</h2>
                <div class="input-control">
                  <input type="text" id="bookTitle" name="bookTitle"  placeholder="Title" required><br><br>
                  <input type="text" id="genre" name="genre"  placeholder="Genre" required><br><br>
                  <label for="issueDate">Issue date:</label>
                  <input type="date" id="issueDate" name="issueDate" placeholder="Date" required><br><br>
                  <input type="integer" id="avalaible" name="avalaible"  placeholder="Available" required><br><br>
                  <input type="integer" id="quantity" name="quantity"  placeholder="Amount" required><br><br>
                </div>
                ${dropdown}
                <div class="chackbox">
                  <input type="checkbox" name="chackthick" id="chackthick" class="cover">
                  <label for="chackthick" class="cover">Thick-skinned</label> 
                </div>
                <button type="submit" class="addbook">Add a Book</button>  
              </form>
              <div class="container">
                <label for="container" id="addauth" class="custom-label">If you can't see the preferred author name in the authors section you need to add the author:</label>
                <button type="submit" class="btn" onclick="openPopup()">Add author</button>
                <form method="POST" action="/addauthor">
                  <div class="popup" id="popup">
                    <input type="text" id="Authorname" placeholder="Author name" name="Authorname" required><br><br>
                    <button type="submit" onclick="closePopup()">Add Author</button>
                </form>
                <button type="submit" onclick="closePopup()">Close</button>
              </div>
              <form id="from" method="POST" action="/book">
                <button type="submit" name="mpage" value="Main page">Main page</button> 
              </form>
              <script>
              let popup = document.getElementById("popup");
              let form = document.querySelector('form');
            
              function openPopup(){
                popup.classList.add("open-popup");
              }
            
              function closePopup(){
                popup.classList.remove("open-popup");
              }
            </script>                     
        </body>
        </html>`)
        res.end();
            }
          })
      }
    });
  });
  //for delete books
app.get('/delete-book', (req,res) => {
  sql = 'delete from books where id = ?'
  sqql = 'DELETE FROM reservation WHERE book_id = ?;'
  id = req.query.id
  connection.query(sql, [id], (error, result)=>{
    connection.query(sqql, [id], (err,ress) =>{
      if(err){
        throw err
      }else{
        res.redirect('/book')
      }
    })
  })
});
app.post('/addauthor',(req,resp)=>{
  const Authorname = req.body.Authorname;
  console.log(Authorname);
  connection.query(`insert into author (firstlast_name) values (?)`, [Authorname], (err,resu)=>{
    if(err){
      throw err
    }else{
      resp.redirect('/book')
    }
  })
})
app.post('/book', (req, res) => {
  const mpage = req.body.mpage;
  if (mpage === 'Main page') {
    res.redirect('/main');
  } else {
    const { bookTitle, bookAuthor, issueDate, avalaible, quantity, genre, checkbox, checkbox1 } = req.body; 
    connection.query('SELECT id FROM author WHERE firstlast_name = ?', [bookAuthor], (error, results) => {
      if (error) {
        throw error;
      } else if (results.length > 0) {
        const authorId = results[0].id;
        connection.query('SELECT id FROM genre WHERE genre = ?', [genre], (err, resu) => {
          if (err) {
            throw err;
          } else if (resu.length > 0) {
            const genreId = resu[0].id;
            connection.query('INSERT INTO books (title, author, genre, issue_date, avalaible, amount) VALUES (?, ?, ?, ?, ?, ?)', [bookTitle, authorId, genreId, issueDate, avalaible, quantity], (erora, resulta) => {
              if (erora) {
                throw erora;
              } else {
                connection.query('SELECT MAX(id) as max_id FROM books WHERE title = ?;', [bookTitle], (error, reslt) => {
                  if (error) throw error;
                
                  const bookId = reslt[0].max_id;
                  console.log(bookId);
                
                  let coverText = 'NO';
                  if (req.body.chackthick) {
                    coverText = 'YES';
                  }
                
                  connection.query('UPDATE books SET cover = ? WHERE id = ?;', [coverText, bookId], (error, results) => {
                    if (error) throw error;
                    console.log('Book cover updated successfully');
                  });
                });
                res.redirect('/book');
              }
            });
          } else {
            connection.query('INSERT INTO genre (genre) VALUES (?)', [genre], (errr, resu) => {
              if (errr) {
                throw errr;
              } else {
                const genreId = resu.insertId;
                connection.query('INSERT INTO books (title, author, genre, issue_date, avalaible, amount) VALUES (?, ?, ?, ?, ?, ?)', [bookTitle, authorId, genreId, issueDate, avalaible, quantity], (erora, resulta) => {
                  if (erora) {
                    throw erora;
                  } else {
                    connection.query('SELECT MAX(id) as max_id FROM books WHERE title = ?;', [bookTitle], (error, reslt) => {
                      if (error) throw error;
                    
                      const bookId = reslt[0].max_id;
                      console.log(bookId);
                    
                      let coverText = 'NO';
                      if (checkbox === 'chackthick') {
                        coverText = 'YES';
                      }
                    
                      connection.query('UPDATE books SET cover = ? WHERE id = ?;', [coverText, bookId], (error, results) => {
                        if (error) throw error;
                        console.log('Book cover updated successfully');
                      });
                    });
                    res.redirect('/book');
                  }
                });
              }
            });
          }
        });
      } else {
        connection.query('insert into author (firstlast_name) values (?)', [bookAuthor], (eroria,resuu) => {
          if (eroria) {
            throw eroria
          }else{
            const authorId = resuu.insertId
                connection.query('SELECT id FROM genre WHERE genre = ?', [genre], (er,ress) => {
                  if (er) {
                    throw er;
                  }  else if (ress.length > 0) {
                    const genreId = ress[0].id;
                    connection.query('INSERT INTO books (title, author, genre, issue_date, avalaible, amount) VALUES (?, ?, ?, ?, ?, ?)', [bookTitle, authorId, genreId, issueDate, avalaible, quantity], (erora, resulta) => {
                      if (erora) {
                        throw erora;
                      } else {
                        connection.query('SELECT MAX(id) as max_id FROM books WHERE title = ?;', [bookTitle], (error, reslt) => {
                          if (error) throw error;
                        
                          const bookId = reslt[0].max_id;
                          console.log(bookId);
                        
                          let coverText = 'NO';
                          if (checkbox === 'chackthick') {
                            coverText = 'YES';
                          }
                        
                          connection.query('UPDATE books SET cover = ? WHERE id = ?;', [coverText, bookId], (error, results) => {
                            if (error) throw error;
                            console.log('Book cover updated successfully');
                          });
                        });
                        res.redirect('/book');
                      }
                    });
                  } else {
                    connection.query('INSERT INTO genre (genre) VALUES (?)', [genre], (errr, resu) => {
                      if (errr) {
                        throw errr;
                      } else {
                        const genreId = resu.insertId;
                        connection.query('INSERT INTO books (title, author, genre, issue_date, avalaible, amount) VALUES (?, ?, ?, ?, ?, ?)', [bookTitle, authorId, genreId, issueDate, avalaible, quantity], (erora, resulta) => {
                          if (erora) {
                            throw erora;
                          } else {
                            connection.query('SELECT MAX(id) as max_id FROM books WHERE title = ?;', [bookTitle], (error, reslt) => {
                              if (error) throw error;
                            
                              const bookId = reslt[0].max_id;
                              console.log(bookId);
                            
                              let coverText = 'NO';
                              if (checkbox === 'chackthick') {
                                coverText = 'YES';
                              }
                            
                              connection.query('UPDATE books SET cover = ? WHERE id = ?;', [coverText, bookId], (error, results) => {
                                if (error) throw error;
                                console.log('Book cover updated successfully');
                              });
                            });
                            res.redirect('/book');
                          }
                        });
                      }
                    });
                  }
                });
              }            
            })
          }
        })          
      }
    });

app.get('/people', (req, res) => {
    connection.query(`SELECT people.id,
    people.firstlast_name AS firstname,
    people.joined_date,
    status1.statuss AS status 
    FROM people 
    JOIN statuss AS status1 ON people.statuss = status1.id 
    LEFT JOIN statuss AS status2 ON people.statuss = status2.id;
    `, (err, results) => {
      if (err){
        throw err;
      }else{
          results = results.map(result => {
            result.joined_date = new Date(result.joined_date).toLocaleDateString();
            return result;
          });
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.write(`<!DOCTYPE html>
          <html>
          <style>
          table, th, td{
          border:1px solid black;
          }
          .delbut{
            text-decoration: none;
            color: green;
          }
          .delbut:hover {
            cursor: pointer;
            color:#002ead;
            transition: 0.7s;
          } 
        .delbut:focus {
          outline-color: transparent;
          outline-style:solid;
          box-shadow: 0 0 0 4px #5a01a7;
        }
      </style>
          <head>
              <title>People</title>
          </head>
          <body>
              <h1>People</h1>
              <table>
                  <thead>
                      <tr>
                          <th>First Name</th>
                          <th>joined_date</th>
                          <th>status</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${results.map(result => `
                      <tr>
                          <td>${result.firstname}</td>
                          <td>${result.joined_date}</td>
                          <td>${result.status}</td>
                      </tr>
                      `).join('')}
                  </tbody>
              </table>
          </body>
          </html>`);
          res.end();
      }
    });
  
  });

app.get('/reservation', (req, res) => {
    connection.query(`SELECT reservation.id,
    books.title as bookname,
    people.firstlast_name AS personname,
    reservation.reservation_date,
    reservation.return_date,
    statuss.statuss AS status
    FROM reservation
    JOIN books ON reservation.book_id = books.id
    join people on reservation.person_id = people.id
    join statuss on reservation.reservation_status = statuss.id
    `, (err, results) => {
      if (err){
        throw err;
      }else{
          results = results.map(result => {
            result.reservation_date = new Date(result.reservation_date).toLocaleDateString();
            result.return_date = new Date(result.return_date).toLocaleDateString();
            return result;
          });
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.write(`<!DOCTYPE html>
          <html>
          <style>
          table, th, td{
          border:1px solid black;
          }
          .delbut{
            text-decoration: none;
            color: green;
          }
          .delbut:hover {
            cursor: pointer;
            color:#002ead;
            transition: 0.7s;
          } 
        .delbut:focus {
          outline-color: transparent;
          outline-style:solid;
          box-shadow: 0 0 0 4px #5a01a7;
        }
      </style>
          <head>
              <title>Reservation</title>
          </head>
          <body>
              <h1>Reservation</h1>
              <table>
                  <thead>
                      <tr>
                          <th>Book Name</th>
                          <th>Person Name</th>
                          <th>Reservation Date</th>
                          <th>Return Date</th>
                          <th>reservation status</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${results.map(result => `
                      <tr>
                          <td>${result.bookname}</td>
                          <td>${result.personname}</td>
                          <td>${result.reservation_date}</td>
                          <td>${result.return_date}</td>
                          <td>${result.status}</td>
                      </tr>
                      `).join('')}
                  </tbody>
              </table>
          </body>
          </html>`);
          res.end();
      }
    });
  });

  app.get('/book%20reservation', (req,res) => {
    query = `SELECT 
    books.title AS title, 
    author.firstlast_name AS author, 
    genre.genre AS genre, 
    books.issue_date, 
    books.avalaible,
    books.amount
    FROM books
    LEFT JOIN author
    ON books.author = author.id
    LEFT JOIN genre
    ON books.genre = genre.id;
    `
    connection.query(query, (err, results) => {
      if (err){
        throw err;
      }else{
          results = results.map(result => {
            result.issue_date = new Date(result.issue_date).toLocaleDateString();
            return result;
          });
  
        const html = res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.write(`<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="style.css">
            <title>Books reservation</title>
        </head>
        <body>
            <h1>Books</h1>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Genre</th>
                        <th>Issue Date</th>
                        <th>Available</th>
                        <th>amount</th>
                    </tr>
                </thead>
                <tbody>
                      ${results.map(result => `
                      <tr>
                          <td>${result.title}</td>
                          <td>${result.author}</td>
                          <td>${result.genre}</td>
                          <td>${result.issue_date}</td>
                          <td>${result.avalaible}</td>
                          <td>${result.amount}</td>
                      </tr>
                      `).join('')}
                </tbody>
            </table>
          <form id="form" method="POST" action="/book%20reservation">
                <h2>Reserve Books:</h2>
                <div class="input-control">
                  <input type="text" id="bookTitle" name="personId" placeholder="PersonID" required><br><br>
                  <input type="text" id="name" name="name"  placeholder="Fullname" required><br><br>
                  <input type="text" id="bookTitle" name="bookTitle" placeholder="Title" required><br><br>
                  <input type="text" id="bookAuthor" name="bookAuthor"  placeholder="Author" required><br><br>
                  <input type="date" id="bookAuthor" name="returndate"  placeholder="Return Date" required><br><br>
                </div>
                <button type="submit">Reserve book</button>  
              </form>
              <form id="from" method="POST" action="/book%20reservation">
                <button type="submit" name="Mpage" value="main page">Main page</button> 
              </form>
        </body>
        </html>`)
        res.end();
      }
    });
  })

  app.post('/book%20reservation', (req,res) => {
    const Mpage = req.body.Mpage;
    if (Mpage === 'main page') {
      res.redirect('/main');
    } else {
      const { personId, bookTitle, bookAuthor, Fullname, returndate} = req.body;
      connection.query('SELECT firstlast_name FROM people WHERE id = ?', [personId], (err,peopleResult) => {
        if (err) {
          throw err
        } else if (peopleResult.length > 0){
          connection.query('SELECT id FROM books WHERE author = ?', [bookAuthor], (err,authorResult) => {
            // const authorId = authorResult[0].id
          })
          connection.query('SELECT id from books WHERE title = ?', [bookTitle], (err,bookResult) => {
            if (err){
              throw err
            } else if (bookResult.length > 0){
              const bookId = bookResult[0].id
              const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Tbilisi' }).split('/').reverse().join('-');
              connection.query('INSERT INTO reservation (book_id, person_id, reservation_date, return_date, reservation_status) VALUES (?, ?, ?, ?, 1)', [bookId, personId, today, returndate], (error, queryResult) => {
                if (error){
                  throw error
                }else{
                  console.log('The operation was completed successfully');
                  connection.query('UPDATE books SET avalaible = IF(amount < avalaible, avalaible, avalaible - 1) WHERE id = ?', [bookId])
                  res.redirect('/book%20reservation')
                }
              })
            }else{
              res.status(400).send("Invalid book or person name. Please try again.");
            }
          })
        }
      })
    }
  })

app.get('/main', (req, res) =>{
  res.sendFile(__dirname + '/index.html');
});

app.post('/main', (req, res) =>{
  const inputValue = req.body.inputField;
  if (inputValue === "book"){
    res.redirect('/book');
  }else if (inputValue === "reservation"){
    res.redirect('/reservation');
  }else if (inputValue === "main"){
    res.redirect('/main');
  }else if (inputValue === "people"){
    res.redirect('/people');
  }else{
    res.send("There is no such table");
  }
});

app.listen(port, () => {
    console.log(`server started on port ${port}`);
})