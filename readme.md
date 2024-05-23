Create new microservice in this monorepo
 firebase init functions

firebase login

firebase init



Deploy all functions from the repo
firebase deploy --only functions 

Deploy all functions from a specific microservice
firebase deploy --only functions:serviceA

Deploy multiple functions (but not all) from a specific microservice
firebase deploy --only functions:serviceA:fun1, fun2

Above command can be tweaked to deploy only partial functions based on repository, groupings, region etc.



List Functions:
firebase functions:list

Delete Functions:
firebase functions:delete function1, function2