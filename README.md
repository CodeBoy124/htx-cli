# htx-cli
A cli to convert htx files (components) to regular php.

## installation
run `npm install -g php-htx-cli` to install the cli.

## cli usage
You can run `htx init` to create a `htx_config.json` file that you can configure for your liking.
After that you can run `htx` or `htx run` to scan for htx files and convert them to php.
You can also use `htx watch` or `htx watch ./path/to/folder/to/watch/` to detect changes and automaticly convert everything

## htx file usage
### importing components
You can import a component using one of two ways.
You can use the `<!-- import ComponentAlias from "./path/to/file" -->` syntax to import with an alias.
You can also use the `<!-- import "./path/to/file" -->` syntax to just use the file name as the component name

### using components
You can use the components as regular html tags with the addition of one thing. You can pass variables to the component by doing `attribute-name=$myVariable`.
The system that the program uses keeps track of what is inside a string and how 'nested' some code is. If you want to add two variables you can't do the following: `added=$a + $b`, because of the spaces that make the program expect another attribute. Instead you can do `added=$a+$b` or `added=($a + $b)`. Every value of a property on a component is just php, so you can still use `"text"` and `7` numbers while also allowing you to use php `$a+$b`.

### accessing properties/attributes inside components
You can access the `$props` variable (or whatever name you have in your config in `constant.props`).
This variable is a associative array.

### accessing the components children
You can use the `<INNER />` tag inside html.
The converter will replace this with it's actual children

### defining global data
By default all components use local data that is not meant to be accessed by any other component.
You can also define global data like this `$GLOBAL_myVariable`.
This is data you can access inside any component inside a page

### global and local functions
When you define a function inside a htx file it will be marked as local.
If you call a function that is not defined in the htx file it will be global.
If you create a function and want it to be global you can just prefix it with `GLOBAL_` just like with variables

### Adding CSS and JS
If you have a lot of components you don't want to manually insert all script tags inside your pages, so I created scopes.
Scoped files will be automaticly imported don't have local and global variables, function or anything else.
You can use the `<SCOPE />` component and set the type attribute to either "css" or "js".
If you have a component you want to add scoped js and css to you can create a `.js` or `.css` file with the same name, so if your component is called `MyButton.htx` and you import it with `<!-- import "./MyButton" -->` it will also check if a `MyButton.js` or `MyButton.css` exist.
You can also use `<JS src="yourFile.js" />` or `<CSS src="yourFile.css" />` to import js or css from a url. This only works if you use `/>` at the end.

### example
If you want to see what a project could look like you can checkout the example folder.
It might give you a better idea what everything does.

## contributing
Feel free to contribute.
Please be clear what you did and also why.
Thank you for considering contributing