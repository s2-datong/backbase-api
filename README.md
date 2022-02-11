# Backbase Dashboard API
NODEJS REST API project

## Running Locally
### Clone Repository
`git clone <repo>`

`cd <clone>`

### Requirements
- Mongo DB
- Redis
- Make sure to update the .env if your details are different

`npm install`

`npm run start`

## Running with Docker Compose
`docker-compose up`

## Testing
- ensure mongodb is running and available at mongodb://127.0.0.1:27017
- ensure a standard redis server is running and available at redis://localhost:6379
- `npm run test`

## ENDPOINTS


## SUMMARY

## About Project
This API Service is part of a much larger SAAS Application micro-service ecosystem. The main application is a SAAS based Business Rules Engine which had the main value proposition of empowering the Business Teams of organizations to capture their Core Business Rules in an external cloud environment through a user friendly UI

Developers and engineers can then make API calls to an endpoint providing a KEY,VALUE JSON object as input. The configured business rules then execute on top of this JSON object and can modify the object to add/remove/update keys based on simple human readable if statements

Example
`Given JSON context {

  user_id: 5,

  days_since_last_login: 6,

  last_month_total_spend: 5200

}
`
And the Business Rule
`
if days_since_last_login is greater than 5 and last_month_total_spend is 

greater than or equal to 4000

then 

SET send_activation to true

ALSO SET qualifies_for_discount to true

ALSO SET max_discount to 0.2 * last_month_total_spend
`

When the JSON object which is called a context is run through the Business Rules Engine, the resultant JSON object would be

`
{
  user_id: 5,

  days_since_last_login: 6,

  last_month_total_spend: 5200,

  send_activation: true,

  qualifies_for_discount: true,

  max_discount: 1040
}
`

This project provides the REST API that is integrated with the dashboard UI