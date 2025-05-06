# Overview
The application has the concept of 
- Servers
- Projects
- Booking Code Groups
- Booking codes

A Project is assigned to a server. Only one project can be assigned to a server
Multiple Booking Code Groups can be assigned to a Project
Multiple Booking codes can be assigned to Booking code Groups but only one booking code can be active at a time within a Booking code Group

# Task
When an engineer is working on a server, they need to be able to book their hours to a booking code. Since only one booking code can be active at a time for server, the engineer needs to be able to select a booking code from a list of available booking codes for the server. 
- The list of available booking codes for a server is the list of booking codes that are assigned to the project that is assigned to the server. 
-The engineer should be able to select a booking code from a dropdown list. 
- The dropdown list should be displayed in the top right corner of the screen. 
- The dropdown list should be hidden when the engineer is not working on a server. 
- The dropdown list should be displayed when the engineer is working on a server.
- After selecting a booking code, the engineer should be able to enter the number of minutes they worked on that server.
- They should also be able to enter a note and select the date they worked on the server.

The record should be stored to the database in a table called engineer_hours. This has not yet been created, so a new schema needs to be created.

The engineer_hours table should have the following columns:
- id (primary key)
- server_id (foreign key to servers)
- booking_code_id (foreign key to booking_codes)
- minutes
- note
- date
- created_at
- updated_at

The engineer_hours table should have the following indexes:
- server_id_idx
- booking_code_id_idx
- date_idx
