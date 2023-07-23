# htx-cli
A cli to convert htx files (components) to regular php.

* [Documentation/Tutorial](https://codeboy124.github.io/htx-docs/)

## Short example
Here is a small example with a page that has bootstrap and contains a button that displays a message and some text

src/pages/index.htx
```html
<!-- import DefaultLayout from "../layouts/Default" -->
<!-- import "../other/HelloWorldButton" -->
<DefaultLayout title=strtoupper("Some Page")>
    <HelloWorldButton />
    <p>
        Some page
    </p>
</DefaultLayout>
```

src/layouts/Default.htx
```php
<?php
if(!isset($props["title"])) $props["title"] = "Page";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $props["title"] ?></title>
    <SCOPES type="css" />

    <CSS src="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" />
    <JS src="https://code.jquery.com/jquery-3.3.1.slim.min.js" />
    <JS src="https://cdn.jsdelivr.net/npm/popper.js@1.14.7/dist/umd/popper.min.js" />
    <JS src="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/js/bootstrap.min.js" />
</head>
<body>
    <INNER />
    <SCOPES type="js" />
</body>
</html>
```

src/other/HelloWorldButton.htx
```html
<button type="button" class="btn btn-primary" onclick="helloWorldMessage()">Hello, World?</button>
```

src/other/HelloWorldButton.js
```js
function helloWorldMessage(){
    alert("Hello, World!");
}
```

If you have Htx installed you can run the following to convert the code and run it with php. This uses the default settings, but they can be changed (see documentation)
```shell
htx
cd out
php -S localhost:3000
cd ../
```
Once it runs you should be able to open [http://localhost:3000/]

## contributing
Feel free to contribute.
Please be clear what you did and also why.
Thank you for considering contributing