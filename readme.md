Create new microservice in this monorepo
1] create a folder at rool level with name of the service "serviceA" eg.
2] cd serviceA && firebase init functions
3] you now have a microservice initializedwith packgae
4] 



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