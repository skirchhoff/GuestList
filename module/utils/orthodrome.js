'use strict';

/**
 *  Orthodrome
 *  @description - calculates distance between two geographic coordinates in km.
 *  Based on formulas at https://de.wikipedia.org/wiki/Orthodrome.
 *  @author - Stephan Kirchhoff <stephan.kirchhoff@gmail.com>
 *  @version - 0.1
 */

module.exports = class Orthodrome {

    
    /**
     * @description - calculates arc between two coordinates
     * @param {Route} r - route object  
     * {start:{
     *      lat:{float},
     *      long:{float}},
     *  finish:{
     *       lat:{float},
     *      long:{float}   
     *  }
     * }
     * @todo: make route iterable for longer routes
     */
    getArc(r) {

        Object.keys(r).map((k, i) => {
            r[k].lat  = this.toRadiance(r[k].lat);
            r[k].long  = this.toRadiance(r[k].long);
         });

        return Math.acos(
             Math.sin(r.start.lat)*Math.sin(r.finish.lat)
            +Math.cos(r.start.lat)*Math.cos(r.finish.lat)
            *Math.cos(r.finish.long-r.start.long));
    }

    /**
     * @description - calculates distance between two geographic coordinates with accuracy of 6km
     * @param {Route} r - route object  
     * {start:{
     *      lat:{float},
     *      long:{float}},
     *  finish:{
     *       lat:{float},
     *      long:{float}   
     *  }
     * }
     * @todo: make route iterable for longer routes
     */
    getDistanceLowPrecission_1(r) {
        return this.getArc(r)*6378.137;
    }

    /**
     * @description - gets distance between two geographic coordinates with accuracy of 6km,
     *                second version
     * @param {Route} r - route object  
     * {start:{
     *      lat:{float},
     *      long:{float}},
     *  finish:{
     *       lat:{float},
     *      long:{float}   
     *  }
     * }
     * @todo: make route iterable for longer routes
     */
    getDistanceLowPrecission_2(r) {
        let a = this.getArc(r);
        return this.toDegrees(a)/360*40000;
    }

    /**
     * @description - gets distance between two geographic coordinates with accuracy of ca. 3km,
     *                avg from version 1 & 2
     * @param {Route} r - route object  
     * {start:{
     *      lat:{float},
     *      long:{float}},
     *  finish:{
     *       lat:{float},
     *      long:{float}   
     *  }
     * }
     * @todo: make route iterable for longer routes
     */
    getDistanceLowPrecission(r) {
        let a = this.getArc(r);
        return (a*6378.137+this.toDegrees(a)/360*40000)/2;
    }

    /**
     * @description - gets distance between two geographic coordinates with accuracy of 0.5km
     * @param {Route} r - route object  
     * {start:{
     *      lat:{float},
     *      long:{float}},
     *  finish:{
     *       lat:{float},
     *      long:{float}   
     *  }
     * }
     * @todo: make route iterable for longer routes
     */
    getDistanceHighPrecission(r) {

        Object.keys(r).map((k, i) => {
            r[k].lat  = this.toRadiance(r[k].lat);
            r[k].long  = this.toRadiance(r[k].long);
         });

        let f = 1/298.257223563;
        let a = 6378.137;

        let F = (r.start.lat+r.finish.lat)/2;
        let G = (r.start.lat-r.finish.lat)/2;
        let l = (r.start.long-r.finish.long)/2;

        let S = Math.pow(Math.sin(G),2)*Math.pow(Math.cos(l),2)
                +Math.pow(Math.cos(F),2)*Math.pow(Math.sin(l),2);

        let C = Math.pow(Math.cos(G),2)*Math.pow(Math.cos(l),2)
                +Math.pow(Math.sin(F),2)*Math.pow(Math.sin(l),2);

        let w = Math.atan(Math.sqrt(S/C));

        let D = 2*w*6378.137;
        
        let T = Math.sqrt(S*C)/w;
        let H1 = (3*T-1)/(2*C);
        let H2 = (3*T+1)/(2*S);

        return D*(1+f*H1*Math.pow(Math.sin(F),2)
                *Math.pow(Math.cos(G),2)-f*H2
                *Math.pow(Math.cos(F),2)
                *Math.pow(Math.sin(G),2));
    };

    /**
     * @description - converts degrees to radiance
     * @param {number} d - degree
     * @return {number} - radiance of given degrees
     */
    toRadiance(d ) {
        return d * (Math.PI/180);
    }

    /**
     * @description - converts radiance to degrees
     * @param {number} d - radiance
     * @return {number} - degrees of given radiance
     */
    toDegrees(r ) {
        return r * (180 / Math.PI);
    }

}