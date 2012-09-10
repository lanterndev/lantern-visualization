Lantern
=======

[View project](http://vizzuality.github.com/lantern)

* This project uses compass to generate the CSS.
* You can run a small server running the <code>asdf</code> gem:

        bundle install
        asdf 

* Before publishing the code, please compress the JavaScript files running: 

        bin/compress-js

  then use the generated <code>all.js</code> file.

**CHANGELOG**

*09/10/12*

- Adds censored country list.
- Removes the blur effect in the city glows to reduce CPU usage.
- Animates user lines.
- Adds fadeIn effect for green nodes.
