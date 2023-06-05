# BotPanel
WebUI for chatgpt-on-wechat [personal fork](https://github.com/TMBMode/chatgpt-on-wechat)

# What
ChatGPT on Wechat web deployment
- Supports multiple instantaneous sessions via child processes
- User management system with keys
- Keys have expire dates, and processes get killed at their expire dates

# Run
```
npm i
node index.mjs
```
 
# Environment Variables
| Variable     | Value   | Usage   
| --------     | -----   | ----- 
| BOTPATH      | string  | Specify the `cwd` directory, like `/home/ubuntu/chatgpt-on-wechat`
| PORT         | int     | The port to run on, defaults to `14514`
| OUTPUT_LIMIT | int     | Limits how much text can be stored for a single session
| DB_PATH      | string  | Specify the path of the database used to store keys

# Management
| Command     | Usage   
| -------     | ----- 
| new/add     | Add a new key (that binds to a process)
| del \[key\] | Delete the given key
| lsdb        | List information in the database
| lsproc      | List running (alive) processes
| kill \[id\] | Kill the process with the given id
| exit/stop   | Quit the program (equals ^C twice)
| mem         | Get system memory usage

# Note
- This is a sloppy project, so I bet you won't even take the time to read this line.
- If you do, hello!
- `key` isn't necessarily equivalent to `procId`, as the project started with numerical ID's with autoincrement cnt. Potential guest processes are allowed
