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
- The green nodes shine with more intensity when a white dot joins them. 

**SPECS**

User spec:

    {
      lat: 1234.56,
      lng: 7890.99
    }

Green nodes:

    [{
      lat: 1234.56,
      lng: 7890.99
      avatar: "http://images.getlantern.org/users/avatar/fl32k32j978fsdfs.jpg"
    },
    {
      lat: 2143.65,
      lng: 8709.99
      avatar: "http://images.getlantern.org/users/avatar/lf233kj2987fdsfs.jpg"
    },
    ...]

Countries centroids (city lights):

    LAT,LONG,FULL_NAME,ISO3136
    42.5,1.5,Principality of Andorra,AD
    60,-96,Canada,CA
    15.5,47.5,Republic of Yemen,YE
