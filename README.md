# Treedoc

A simple little thing I made to organize things hierarchically and put it up online

Very basic styling, just plain CSS.

## Overview

Provides a framework for loading an XML formatted "treedoc" that describes a nesting of articles/information

An example of this is provided: the rules are basic. The top level element is a ```treedoc```, which can contain ```item``` and ```category``` tags. Category tags can also contain ```item``` and ```category``` tags.

Every tag can contain a ```description``` tag which is a TAG-line (ha) for the item when displayed

```category``` and ```item``` tags can have a ```name``` attribute, while the ```item``` tags can also specify a ```src``` and ```format``` attribute.

```src``` points to a location in the ```doc``` folder of some document to display (markdown or html), while ```format``` specifies the format (```html``` or ```markdown```)

To run, run ```sudo npm start``` or just ```npm start``` if you are an individual of great status and impenetrable will.

It does run on port 80 normally though, so you may want to change that in ```config.js``` if you already have something running there
