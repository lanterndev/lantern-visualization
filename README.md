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

Centroids:

    LAT,LONG,DMS_LAT,DMS_LONG,MGRS,JOG,DSG,AFFIL,FIPS10,SHORT_NAME,FULL_NAME,MOD_DATE,ISO3136
    28,3,280000,30000,31REL0000097202,NH31-15,PCLI,,AG,Algeria,People's Democratic Republic of Algeria,2011-03-03,DZ
    -14.3333333,-170,-142000,-1700000,1802701,,PCLD,US,AS,American Samoa,Territory of American Samoa,1998-10-06,AS
    42.5,1.5,423000,13000,31TCH7675006383,NK31-04,PCLI,,AN,Andorra,Principality of Andorra,2007-02-28,AD
    -34,-64,-340000,-640000,20HMH0765037393,SI20-06,PCLI,,AR,Argentina,Argentine Republic,2007-02-28,AR
