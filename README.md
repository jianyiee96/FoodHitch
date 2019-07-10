# FoodHitch
FoodHitch - Food delivery sharing telegram bot

How to Use:

Go to telegram and search for @Food_hitch_bot

Registration:
New user to the bot will be required to register, for record and authentication purposes. The bot will prompt the user to input his Phone Number, and Place of Residence. Along with these data, the user’s Telegram id, username and first name would be stored into the database. Once registration is completed, the user would be able to use the bot.
Remark: If the user is using the bot for the first time, the user would be given step-by-step procedures to use the bot.
Search:
User can use the “search” command (“/search”) to list down all the joinable orders in the next few hours. The following information of the orders will be shown:
Order ID: Unique identifier for each order listing
Type of Food: The restaurant which the host is ordering from
Date: The date when the user orders the food
Expected ordering time: The expected time when the host orders the food
Pick up location: Detailed information on where the food will be delivered to
Join:
Upon invoking this command, the bot will list down all the order groups that the user has already joined/ requested to join, along with the status (pending/ accepted/ declined). 
The user can then specify the Order ID of an available host that he/ she is interested in joining. The bot will retrieve the order with the ID and display the host’s contact information. Then, the bot will request for the user’s order information to craft a join request, which will be sent to the host. 
After sending the join request, the host will receive a message from the bot, containing the join request and a confirmation code. The confirmation code will be used when the host wants to accept/ decline the join request.
Remark: Once a user has been accepted for a join, he/ she will not be able to send another join request for the same order group. When the status of a join request is “pending”, the hitch foodie will not be able to send another join request for that order.

Host:
The bot will behave differently to different types of users: 
Users that have an existing host.
Users that do not have an existing host.
If a user is currently hosting an order, he/ she will be directed to the following host menu: 
Do nothing - do nothing
Update status: Complete - update the status of the order as complete
When the host selects “Update status: Complete”, the order will be set to be complete in the database and the order will be removed from the “/search” menu. The users that join this order group will no longer be able to see this listing in their /join command. All the hitch foodies in this order group will be notified when the host set this order as “complete”.
Update status: Cancelled - update the status of the order as cancelled
When the host selects “Update status: Cancelled”, the order will be set to be cancelled in the database and the order will be removed from the “/search” menu. All the hitch foodies in this order group will be notified when the host set this order as “cancelled”.
View joins - view the join-requests for the order
When the host selects “View joins”, he/ she will be able to see all the pending/ accepted join requests. For the requests that are still pending, the confirmation code will be shown for ease of accepting new requests.
Broadcast message - broadcast a message to the hitch foodies in the order group
The host can broadcast a message to his/ her hitch foodies. This is useful for letting the hitch foodies to know the delivery fees, or when the food has arrived.
If the user is not hosting, the “/host” command will allow the user to start a new order group, and the user will need to specify the type of food to order, the expected ordering time and the pick-up location.
Remark: Each user can only host up to one order at a time. 

Accept:
This command is designed for users that have an existing host. When a join request is sent to the host, the host will be able to read the join request and decide if he/ she wants to accept the hitch foodie to join the order pool. After typing the “/accept” command, the bot will prompt the host to input the confirmation code. Upon inputting a valid confirmation code, the host will choose if he/ she wants to accept or decline the join request. After deciding, the bot will notify the hitch foodie, telling he/ she if the request was accepted or declined by the host.

