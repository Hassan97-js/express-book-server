# Book Server

## Project setup

```
npm install
```

### Microsoft SQL Server

- Install "Microsoft SQL Server" link: (https://www.microsoft.com/sv-se/sql-server/sql-server-downloads)
- Follow the linkn and scoll down until you find "Developer edition of SQL-Server" and at the bottom of the page under the heading "Tools" you will find SQL Server Management Studio (SSMS), install them both and there must be a choice "Basic Installation".
- After you've install the SSMS, open it => restore the database "Hassan_db" which is in the folder database.
- In order to restore a database in (SSMS): right-click on "Database folder" then choose "Restore Database" then "Device" and then choose the path for where to find the database and then click "Ok"

### If you use windows:

### You have to fix/check a few things before testing the code

- Open "Computer Management" then choose "Services and Applications" then "SQL Server Configuration Manager" then "Protocols for MSSQLServer" and finally enable "TCP/IP". Check also "Properties" and double-klick on "TCP Port" and check if it sets to "1433"
- Open "Services" then "SQL Server Agent" then "Start Up Type" should be "Automatic".
- Find also "SQL Server Browser" and check if "Start up Type" is "Automatic"
- Finally open "MS SQL Management Studio" och right-click on 'DESKTOP-' database in 'Object Explorer' and then click "Restart"
