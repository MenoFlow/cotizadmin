fetch('http://localhost:3000/api/members', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidXNlclRlc3QiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0MDQ3NjQ2MCwiZXhwIjoxNzQwNDgwMDYwfQ.xiFwHzHZTtO5DBNttg8HIpN2jWvTykvbNW6Fsl8dYFo'  // Remplacez par votre token généré
    }
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
  



curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidXNlclRlc3QiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0MDQ4ODY3MywiZXhwIjoxNzQwNDkyMjczfQ.d8M14JZF2iLd4AH4_3qU0jzLARK2e9Crv8oSi-uFnjU" http://localhost:3000/api/protected
