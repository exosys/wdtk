Workspace command

# The workspace should be multi root

root
+--> scope1
+-----> app
+-----> lib
+--> scope2
+----->app
+----->lib

Concerns:

- angular apps cannot be scoped so this could lead to name clashes in angular.json

# user should be able to select to work with one or all workspaces
