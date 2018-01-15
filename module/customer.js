/**
 *  Customer
 *  @description - Shows list of customers who are within a given distance range.
 */

const fs = require('fs');
const Orthodrome = require('./utils/orthodrome');

// Future of Voice coordinates
const FV_LAT = 52.493256;
const FV_LONG = 13.446082;

// max customer distance in km
const DISTANCE = 100;

// regular expressions
const ID_REGX = /[a-z,0-9]{8}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{12}/;
const GEO_REGX = /[^a-z,\s,:,\,]*[0-9]+[^a-z,\s,:,\,]{0,2}[.][^a-z,\s,:,\,]*[0-9]+[^a-z,\s,:,\,]{5,7}/mgi;

const PARAM_BLOCK = /(([a-z,0-9]{0,}:[\s]{0,})[^a-z,\s,:,\,]*[0-9]+[^a-z,\s,:,\,]{0,2}[.][^a-z,\s,:,\,]*[0-9]+[^a-z,\s,:,\,]{5,7}|([a-z,0-9]{0,}:[\s]{0,})[a-z,0-9]{8}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{12}|([\r\n]))/mgi;
const NAME_DOUBLE = /[a-z,0-9]{0,}:/
const NAME = /[a-z,0-9]{0,}/


module.exports = class Customer {

    constructor(){
        this.warnings = []; // error and warnings stack
    }

    /**
     * @description - loads file with customer data and starts parsing proccess 
     * @param {string} p - path & filename to customer file 
     */
    getCustomerFile(p){
        let out = "";

        fs.readFile(p,(e,d)=>{
            if (e) throw e;
            this.printResult(this.getCustomer(d.toString())); 
        });
    }

    /**
     * @description - prints errors, warnings and result to console
     * @param {customer{}} d - list of customers
     */
    printResult(d){
        this.warnings.map(w=>{
            console.log(w);
        });

        d.map(c=>{
            console.log(c.id);
        });

        console.log("\n" + d.length+" customers found.");
    }

    /**
     * @description - starts parsing proccess, sort list and filters customers by distance
     * @param {string} d - content of customer file
     * @returns {string[]} - list of customers within range of DISTANCE 
     */
    getCustomer(d){

        let c = this.generateCustomerObject(d);
        c = c.sort((a,b)=>this.sortCustomer(a,b));
        return this.getCustomersByDistanceRange(c,DISTANCE);
    }

    /**
     * @description - sorts array alphanumeric ascending
     * @param {string[]} a - array element to compare 
     * @param {string[]} b - array element to compare 
     */
    sortCustomer(a,b){
        return a.id < b.id ? -1 : ( b.id < a.id ? 1: 0 );
    }

    /**
     * @description - get list of customers within given distance range
     * @param {customer[]} c - list of customer objects 
     * @param {number} d - distance in km
     * @returns {customer[]} - list of customers within given range
     */
    getCustomersByDistanceRange(c,d){

        const geo = new Orthodrome();
        let out = [];

        c.map(o=>{

            let config = {
                start:{
                    lat:FV_LAT, 
                    long:FV_LONG},
                finish:{
                    lat:o.lat,
                    long:o.long
                }
            };
            
            o.distance = geo.getDistanceHighPrecission(config);
            if(o.distance <= d){

                out.push(o);
            }
        })

        return out;
    }

    /**
     * @description - parses customer data string to object and validates types by regex
     * @param {string} co - customer row element from file
     * @returns {customer{} | undefined} 
     */
    generateCustomerObject(d){

        let va = [];
        let _oBlock = "";
        let c = [];

        // splits file in to data blocks, ignores customers with bad formed values
        d.match(PARAM_BLOCK).map(v=>{

            if(v=='\n'){
                let cs_o = JSON.parse('{'+_oBlock+',"distance":0}');
                if(this.setWarnings(cs_o)){
                    c.push(cs_o);
                }
                
                _oBlock="";
            }else{
                let identifier = v.match(NAME_DOUBLE)[0].match(NAME)[0];
                switch(identifier){
                    case 'id':
                        _oBlock += ( _oBlock == "" ? '"' : ',"' ) + identifier + '":"' + v.match(ID_REGX)+'"';
                        break;
                    case 'lat':
                        _oBlock += ( _oBlock == "" ? '"' : ',"' ) + identifier + '":' + v.match(GEO_REGX);
                        break;
                    case 'long':
                        _oBlock += ( _oBlock == "" ? '"' : ',"' ) + identifier + '":' + v.match(GEO_REGX);
                        break;
                    default:
                        break;
                }
            }
        });

        return c;
    }

    /**
     * @description - error handling and error log
     * @param {number} w - 0 - ... 
     * @param {customer{}} o - 
     */
    setWarnings(o){

        let stay = true;
        if(Object.keys(o).length<4){

            if(!o.id){
                this.warnings.push("\n\x1b[1mWarnung!\x1b[0m\nDer Kunde mit den Koordinaten '"+o.lat+","+o.long+"' scheint eine fehlerhafte ID zu haben!\n");
                stay = false;
                
            }

            if(!o.lat|| !o.long){
                this.warnings.push("\n\x1b[1mWarnung!\x1b[0m\nDer Kunde mit der ID '"+o.id+"' hat fehlerhafte geographische Daten\n"
                +"und kann, da die Distanz nicht ermittelt werden kann, nicht ausgwertet werden!\n");
                stay = false;
            }
        }

        return stay;
    };
}
