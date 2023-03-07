"use strict";

import {
  LinearFee,
  BigNum,
  Ed25519KeyHash,
  Address,
  RewardAddress,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  CoinSelectionStrategyCIP2,
  TransactionOutputs,
  TransactionOutput,
  Value,
  TransactionBuilder,
  Certificates,
  Certificate,
  StakeRegistration,
  StakeDelegation,
  MultiAsset,
  Assets,
  min_ada_required,
  Transaction as _Transaction,
  TransactionWitnessSet,
  TransactionBuilderConfigBuilder, TransactionBuilderConfig
} from "@emurgo/cardano-serialization-lib-asmjs";

import { Buffer } from "buffer";

import StringFormatError from "../errors/WalletInterfaceError/StringFormatError";

import WalletInterfaceError from "../errors/WalletInterfaceError";
import NamiError from "../errors/WalletInterfaceError/WalletProcessError/WalletError/NamiError";
import CCVaultError from "../errors/WalletInterfaceError/WalletProcessError/WalletError/CCVaultError";
import FlintError from "../errors/WalletInterfaceError/WalletProcessError/WalletError/FlintError";
import YoroiError from "../errors/WalletInterfaceError/WalletProcessError/WalletError/YoroiError";
import GeroError from "../errors/WalletInterfaceError/WalletProcessError/WalletError/GeroError";
import TyphonError from "../errors/WalletInterfaceError/WalletProcessError/WalletError/TyphonError";
import CardwalletError from "../errors/WalletInterfaceError/WalletProcessError/WalletError/CardwalletError";
import WalletError from "../errors/WalletInterfaceError/WalletProcessError/WalletError";
import WalletProcessError from "../errors/WalletInterfaceError/WalletProcessError";

function private_warnDeprecated(altSuggestion)
{
  console.error("this mthod will be deprecated soon" + ( altSuggestion ? ", please consider using " + altSuggestion + " instead" : "") );
}

let private_walletInterface_hasBlockFrost = false;
class Wallet
{
    /**
     * @private
     */
    static _api_key = undefined;

    /**
     * @private
     */
    static _protocolParameters = undefined;

    // ---------------------------------------- nami objects ---------------------------------------- //
    /**
     * @private
     */
    static _namiObj = undefined;

    /**
     * @private
     */
    static _namiInterface = undefined;

    /**
     * @private
     */
    static _NamiWallet = undefined;

    // ---------------------------------------- ccvault objects ---------------------------------------- //
    
    /**
     * @private
     */
    static _eternlObj = undefined;

    /**
     * @private
     */
    static _eternlInterface = undefined;
    
    /**
     * @private
     */
    static _EternlWallet = undefined;


    // ---------------------------------------- flint objects ---------------------------------------- //

    /**
     * @private
     */
    static _flintObj = undefined;

    /**
     * @private
     */
    static _flintInterface = undefined;
    
    /**
        * @private
        */
    static _flintWallet = undefined;

    // ---------------------------------------- yoroi objects ---------------------------------------- //

    /**
     * @private
     */
    static _yoroiObj = undefined;

    /**
     * @private
     */
    static _yoroiInterface = undefined;

    /**
    * @private
    */
    static _yoroiWallet = undefined;

    // ---------------------------------------- gero objects ---------------------------------------- //

    /**
     * @private
     */
    static _geroObj = undefined;

    /**
     * @private
     */
    static _geroInterface = undefined;

    /**
     * @private
     */
    static _geroWallet = undefined;

    // ---------------------------------------- Typhon objects ---------------------------------------- //
    /**
     * @private
     */
    static _typhonObj = undefined;

    /**
     * @private
     */
    static _typhonInterface = undefined;

    /**
     * @private
     */
    static _TyphonWallet = undefined;

    // ---------------------------------------- cardWallet objects ---------------------------------------- //
    /**
     * @private
     */
    static _cardWalletObj = undefined;

    /**
        * @private
        */
        static _cardWalletInterface = undefined;
    
    /**
        * @private
        */
    static _CardWalletWallet = undefined;

    // ---------------------------------------- wallet utils ---------------------------------------- //

    static _assertBrowser()
    {
        if( typeof window === "undefined" ) throw new WalletInterfaceError("can check for any cardano wallet extension only in a browser environment");
    }

    static Names = Object.freeze({
        Nami: "Nami",
        /**
         * @deprecated use Eternl instead
         */
        CCVault: "ccvault",
        Eternl: "eternl",
        Flint: "Flint Wallet",
        Yoroi: "yoroi",
        Gero: "GeroWallet",
        Typhon: "Typhon Wallet",
        Cardwallet: "CardWallet"
    });

    // dynamicaly genearted so that any change is updated immediately
    static stringNames = Object.freeze(
        Object.keys( Wallet.Names )
        .map( walletName => {

        if( walletName === Wallet.Names.CCVault ) return undefined;
        
        return Wallet.Names[ walletName ]
        })
        .filter( wName => wName !== undefined )
    );

    /**
     * @depreacted same thing now
     */
    static utils = {
        getStringFromWalletName: Wallet._getStringFromWalletName,
        getWalletNameFromString: Wallet._getWalletNameFromString
    }

    /**
     * @depreacted same thing now
     */
    static _getStringFromWalletName( walletNameEnum )
    {
        const invalidSymbolError = new WalletInterfaceError("walletNameEnum must be a property of the Wallet.Names enum object");;
        // if( typeof walletNameEnum !== "symbol" ) throw invalidSymbolError;
        if( !Wallet.stringNames.includes( walletNameEnum ) ) throw invalidSymbolError;

        return walletNameEnum;
    }

    /**
     * @depreacted same thing now
     */
    static _getWalletNameFromString( string )
    {
        const invalidString = new WalletInterfaceError("getWalletNameFromString parameter must be a valid wallet string name");

        if( typeof string !== "string" )    throw invalidString;
        if( !Wallet.stringNames.includes(string) ) throw invalidString;

        return string;
    }






  // --------------------------- WORLD INTERACTION ----------------------------- //

  /**
   * 
   * @param {string} blockfrost_project_id blockforst api key to be used
   */
  static setBlockfrost( blockfrost_project_id )
  {    
    if( typeof blockfrost_project_id !== "string" ) throw new StringFormatError("blockfrost_project_id must be a string")
    
    Wallet._api_key = blockfrost_project_id;
    
    private_walletInterface_hasBlockFrost = true;
  }
  
  static async makeBlockfrostRequest( endpoint, headers, body )
  {
    if( !private_walletInterface_hasBlockFrost ) throw new WalletProcessError("Wallet.setBlockfrost has not been called, can't use Wallet.makeBlockfrostRequest")
    return await private_blockfrostRequest( Wallet._api_key, endpoint, headers, body );
  }

  static hasProtocolParameters()
  {
    return ( Wallet._protocolParameters !== undefined );
  }

  static async getProtocolParameters( blockfrost_project_id = undefined )
  {

    if( !Wallet.hasProtocolParameters() )
    {
        let api_key_toUse = "";

        if( typeof blockfrost_project_id === "string" )
        {
            api_key_toUse = blockfrost_project_id;
        }
        else
        {
            if( !private_walletInterface_hasBlockFrost ) throw new WalletProcessError("Wallet.setBlockfrost has not been called, can't use Wallet.getProtocolParameters")

            api_key_toUse = Wallet._api_key;
        }

        Wallet._protocolParameters = await private_getProtocolParameters( api_key_toUse );
    }

    return Wallet._protocolParameters;
  }

  static get protocolParameters()
  {
    if( !Wallet.hasProtocolParameters() ) throw new WalletError("protocolParameters never checked before, call the async version Wallet.getProtocolParameters first");
    
    return Wallet._protocolParameters;
  }








  // ----------------------------------------------- Wallet common --------------------------------------------------- //


    /**
     * 
     * @param {string} walletName
     * @throws {WalletProcessError} if the string passed is not included in the Wallet.stringNames array 
     */
    static _assertWalletNameIsValid( walletName )
    {
        if( typeof walletName !== "string" )
            throw new WalletProcessError("a wallet identifier should be a member of the ```Wallet.Names``` enumeration");
        if( !Wallet.stringNames.includes( walletName ) )
            throw new WalletProcessError("a wallet identifier should be a member of the ```Wallet.Names``` enumeration");
    }

    static _assertWalletExtensionInjected( walletName )
    {
        Wallet._assertWalletNameIsValid( walletName );

        if( !Wallet.has( walletName ) ) throw new WalletError("can't access the "+walletName+" object if the "+walletName+" extension is not installed");
    }
  


    /**
     * 
     * @param {Wallet.WalletStringName} wallet member of the Wallet.Names enum object
     * @returns {boolean} ```true``` if the extension has been injected, ```false``` otherwise
     */
    static has( wallet )
    {
        Wallet._assertBrowser();
        Wallet._assertWalletNameIsValid( wallet );

        switch( wallet )
        {
            /*
            if you need to modify the cases please make sure
            any change is made also in the Wallet.Names object
            */
            case Wallet.Names.Nami:               return !!window?.cardano?.nami;
            case Wallet.Names.CCVault:
            case Wallet.Names.Eternl:             return !!window?.cardano?.eternl;
            case Wallet.Names.Flint:              return !!window?.cardano?.flint;
            case Wallet.Names.Yoroi:              return !!window?.cardano?.yoroi;
            case Wallet.Names.Gero:               return !!window?.cardano?.gerowallet;
            case Wallet.Names.Typhon:             return !!window?.cardano?.typhon;
            case Wallet.Names.Cardwallet:         return !!window?.cardano?.cardwallet;

            default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }
    }

  /**
   * 
   * @param {Wallet.WalletStringName} wallet: element of Wallet.name enumerative object 
   * @returns {Wallet.Wallet} the dApp connecctor corresponding to the name
   */
    static get( wallet )
    {
        Wallet._assertBrowser();
        Wallet._assertWalletNameIsValid( wallet );
    
        switch( wallet )
        {
            /*
            if you need to modify the cases please make sure
            any change is made also in the Wallet.Names object
            */
            case Wallet.Names.Nami:               return Wallet.Nami;
            case Wallet.Names.CCVault:
            case Wallet.Names.Eternl:             return Wallet.CCVault;
            case Wallet.Names.Flint:              return Wallet.Flint;
            case Wallet.Names.Yoroi:              return Wallet.Yoroi;
            case Wallet.Names.Gero:               return Wallet.Gero;
            case Wallet.Names.Typhon:             return Wallet.Typhon;
            case Wallet.Names.Cardwallet:         return Wallet.Cardwallet;

            default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }
    }

    /**
     * 
     * @param {Wallet.WalletStringName} wallet: element of Wallet.name enumerative object
     * @returns {Wallet.WalletInterface} initial API that allows enabling wallet
     */
    static getInterface( wallet )
    {
        Wallet._assertBrowser();
        Wallet._assertWalletNameIsValid( wallet );

        if( wallet === Wallet.Names.Nami )
        {
            return Wallet.NamiInterface;
        }            
        else if(
            wallet === Wallet.Names.Eternl ||
            wallet === Wallet.Names.CCVault
        )
        {
            return Wallet.CCVaultInterface;
        }
        else if( wallet === Wallet.Names.Flint )
        {
            return Wallet.FlintInterface;
        }
        else if( wallet === Wallet.Names.Gero )
        {
            return Wallet.GeroInterface;
        }
        else if( wallet === Wallet.Names.Typhon )
        {
            return Wallet.TyphonInterface;
        }
        else if( wallet === Wallet.Names.Yoroi )
        {
            return Wallet.YoroiInterface;
        }
        else if( wallet === Wallet.Names.Cardwallet )
        {
            return Wallet.CardwalletInterface;
        }
        else throw new WalletProcessError("invalid argument; wallet name should be a member of the Wallet.Names enumeration object")
    }
  
    /**
     * 
     * @param {Wallet.WalletStringName} wallet member of the Wallet.Names enum object
     */
    static async enable( wallet )
    {
        Wallet._assertWalletExtensionInjected( wallet );

        switch( wallet )
        {
            /*
            if you need to modify the cases please make sure
            any change is made also in the Wallet.Names object
            */
            case Wallet.Names.Nami:               
                Wallet._namiObj = await window.cardano.nami.enable();
                return; break;

            case Wallet.Names.CCVault:
            case Wallet.Names.Eternl:            
                Wallet._eternlObj = await window.cardano.eternl.enable();
                return; break;

            case Wallet.Names.Flint:
                Wallet._flintObj = await window.cardano.flint.enable();
            return; break;

            case Wallet.Names.Yoroi:              
                Wallet._yoroiObj = await window.cardano.yoroi.enable();
                return; break;

            case Wallet.Names.Gero:               
                Wallet._geroObj = await window.cardano.gerowallet.enable();
                return; break;

            case Wallet.Names.Typhon:
                let tResult =  await window.cardano.typhon.enable();
                if( tResult.status )
                {
                Wallet._typhonObj = window.cardano.typhon;
                }
                else throw new TyphonError("user rejected typhon connection")
            return;
            break;
            case Wallet.Names.Cardwallet:
                Wallet._cardWalletObj = await window.cardano.cardwallet.enable();
                return;
            break;

            default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }
    }

    /**
     * 
     * @param {Wallet.WalletStringName} wallet member of the Wallet.Names enum object
     * @returns {boolean} ```true``` if the user wallet is connected, ```false``` otherwise
     */
    static async isEnabled( wallet )
    {
        Wallet._assertWalletExtensionInjected( wallet );

        let walletIsEnabled = false;

        switch( wallet )
        {
            /*
            if you need to modify the cases please make sure
            any change is made also in the Wallet.Names object
            */
            case Wallet.Names.Nami:               
                walletIsEnabled = await window.cardano.nami.isEnabled();
            break;
                
            case Wallet.Names.CCVault:            
                walletIsEnabled = await window.cardano.eternl.isEnabled();
            break;
                
            case Wallet.Names.Flint:
                walletIsEnabled = await window.cardano.flint.isEnabled();
            break;
                
            case Wallet.Names.Yoroi:              
                walletIsEnabled = await window.cardano.yoroi.isEnabled();
            break;
                
            case Wallet.Names.Gero:               
                walletIsEnabled = await window.cardano.gerowallet.isEnabled();
            break;

            case Wallet.Names.Typhon:
                let {status, data} = await window.cardano.typhon.isEnabled();
                walletIsEnabled = data && status;
            break;

            case Wallet.Names.Cardwallet:
                walletIsEnabled = await window.cardano.cardwallet.isEnabled();
            break;

            default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }

        if( walletIsEnabled )
        {
            await Wallet.enable( wallet );
            return true;
        }
        else
        {
            return false;
        };

    }

    /**
     * 
     * @param {Wallet.WalletStringName} wallet member of the Wallet.Names enum object
     * 
     * @returns {boolean} true if the Wallet instance is ready to be used, false if it has to be enabled
     */
    static isAviable( wallet )
    {
        // Wallet._assertBrowser() not needed since checks into the Wallet class only
        Wallet._assertWalletNameIsValid( wallet );

        switch( wallet )
        {
            /*
            if you need to modify the cases please make sure
            any change is made also in the Wallet.Names object
            */
            case Wallet.Names.Nami:               return ( Wallet._namiObj !== undefined );
            case Wallet.Names.CCVault:            return ( Wallet._eternlObj !== undefined );
            case Wallet.Names.Eternl:             return ( Wallet._eternlObj !== undefined );
            case Wallet.Names.Flint:              return ( Wallet._flintObj !== undefined );
            case Wallet.Names.Yoroi:              return ( Wallet._yoroiObj !== undefined );
            case Wallet.Names.Gero:               return ( Wallet._geroObj !== undefined );
            case Wallet.Names.Typhon:             return ( Wallet._typhonObj !== undefined );
            case Wallet.Names.Cardwallet:         return ( Wallet._cardWalletObj !== undefined )

            default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }
    }










  // ---------------------------------------- Nami ---------------------------------------- //

    static get NamiInterface()
    {
        if( !Wallet.has( Wallet.Names.Nami ) ) throw new NamiError("can't access the nami object if the nami extension is not installed");

        if( Wallet._namiInterface === undefined )
        {
            Wallet._namiInterface = private_makeWalletInterface( Wallet.Names.Nami );
        }
        
        return Wallet._namiInterface;
    }

    static get Nami()
    {
        if( !Wallet.has( Wallet.Names.Nami ) ) throw new NamiError("can't access the Nami object if the nami extension is not installed");
        if( !Wallet.isAviable( Wallet.Names.Nami ) ) throw new NamiError("Wallet.enableNami has never been called before, can't access the Nami wallet object");

        if( Wallet._NamiWallet === undefined )
        {
            Wallet._NamiWallet = private_makeWallet( Wallet._namiObj, Wallet._api_key )
        }

        return Wallet._NamiWallet;
    }
    
    // ---------------------------------------- ccvault || eternl ---------------------------------------- //

    static get CCVaultInterface() { return Wallet.EternlInterface; }
    static get EternlInterface()
    {
        if( 
            !Wallet.has( Wallet.Names.CCVault ) ||
            !Wallet.has( Wallet.Names.Eternl ) 
        ) throw new CCVaultError("can't access the ccvault object if the ccvault extension is not installed");

        if( Wallet._eternlInterface === undefined )
        {
            Wallet._eternlInterface = private_makeWalletInterface( Wallet.Names.CCVault );
        }
        
        return Wallet._eternlInterface;
    }

    static get CCVault() { return Wallet.Eternl; }
    static get Eternl()
    {
        if( 
            !Wallet.has( Wallet.Names.CCVault ) ||
            !Wallet.has( Wallet.Names.Eternl ) 
        ) throw new CCVaultError("can't access the CCVault object if the CCVault extension is not installed");
        
        if( 
            !Wallet.isAviable( Wallet.Names.CCVault ) ||
            !Wallet.isAviable( Wallet.Names.Eternl ) 
        )throw new CCVaultError("Wallet.enableCCVault has never been called before, can't access the CCVault wallet object");

        if( Wallet._EternlWallet === undefined )
        {
            Wallet._EternlWallet = private_makeWallet( Wallet._eternlObj, Wallet._api_key )
        }

        return Wallet._EternlWallet;
    }

 

    // ---------------------------------------- flint  ---------------------------------------- //
    
    static get FlintInterface()
    {
        if( !Wallet.has( Wallet.Names.Flint ) ) throw new FlintError("can't access the flint object if the flint extension is not installed");

        if( Wallet._flintInterface === undefined )
        {
        Wallet._flintInterface = private_makeWalletInterface( Wallet.Names.Flint );
        }
        
        return Wallet._flintInterface;
    }

    static get Flint()
    {
        if( !Wallet.has( Wallet.Names.Flint ) ) throw new FlintError("can't access the flint object if the flint extension is not installed");
        if( !Wallet.isAviable( Wallet.Names.Flint ) ) throw new FlintError("Wallet.enableFlint has never been called before, can't access the flint wallet object");

        if( Wallet._flintWallet === undefined )
        {
        Wallet._flintWallet = private_makeWallet( Wallet._flintWallet, Wallet._api_key )
        }

        return Wallet._flintWallet;
    }

    // ---------------------------------------- yoroi ---------------------------------------- //

    static get YoroiInterface()
    {
        if( !Wallet.has( Wallet.Names.Yoroi ) ) throw new YoroiError("can't access the yoroi object if the yoroi extension is not installed");

        if( Wallet._yoroiInterface === undefined )
        {
        Wallet._yoroiInterface = private_makeWalletInterface( Wallet.Names.Yoroi );
        }
        
        return Wallet._yoroiInterface;
    }

    static get Yoroi()
    {
        if( !Wallet.has( Wallet.Names.Yoroi ) ) throw new WalletInterfaceError("can't access the Yoroi object if the Yoroi nigthly extension is not installed");
        if( !Wallet.isAviable( Wallet.Names.Yoroi ) ) throw new WalletInterfaceError("Wallet.enableYoroi has never been called before, can't access the Yoroi interface");

        if( Wallet._yoroiWallet === undefined )
        {
        Wallet._yoroiWallet = private_makeWallet( Wallet._yoroiObj, Wallet._api_key )
        }

        return Wallet._yoroiWallet;
    }

    // ---------------------------------------- gerowallet ---------------------------------------- //

    static get GeroInterface()
    {
        if( !Wallet.has( Wallet.Names.Gero ) ) throw new GeroError("can't access the gero object if the gerowallet extension is not installed");

        if( Wallet._geroInterface === undefined )
        {
        Wallet._geroInterface = private_makeWalletInterface( Wallet.Names.Gero );
        }
        
        return Wallet._geroInterface;
    }

    static get Gero()
    {
        if( !Wallet.has( Wallet.Names.Gero ) ) throw new WalletInterfaceError("can't access the Gero object if the Gero Wallet extension is not installed");
        if( !Wallet.isAviable( Wallet.Names.Gero ) ) throw new WalletInterfaceError("Wallet.enableGero has never been called before, can't access the Gero interface");

        if( Wallet._geroWallet === undefined )
        {
        Wallet._geroWallet = private_makeWallet( Wallet._geroObj, Wallet._api_key )
        }

        return Wallet._geroWallet;
    }

    // ---------------------------------------- typhon ---------------------------------------- //

    
    static get TyphonInterface()
    {
        if( !Wallet.has( Wallet.Names.Typhon ) ) throw new TyphonError("can't access the Typhon object if the Typhon extension is not installed");

        if( Wallet._typhonInterface === undefined )
        {
        Wallet._typhonInterface = private_makeWalletInterface( Wallet.Names.Typhon );
        }
        
        return Wallet._typhonInterface;
    }

    static get Typhon()
    {
        if( !Wallet.has( Wallet.Names.Typhon ) ) throw new TyphonError("can't access the Typhon object if the Typhon Wallet extension is not installed");
        if( !Wallet.isAviable( Wallet.Names.Typhon ) ) throw new TyphonError("Wallet.enable( Wallet.Names.Typhon ) has never been called before, can't access the Typhon interface");

        if( Wallet._TyphonWallet === undefined )
        {
        Wallet._TyphonWallet = private_makeWallet( Wallet._typhonObj, Wallet._api_key )
        }

        return Wallet._TyphonWallet;
    }

    // ---------------------------------------- cardwallet ---------------------------------------- //


    static get CardwalletInterface()
    {
        if( !Wallet.has( Wallet.Names.Cardwallet ) ) throw new CardwalletError("can't access the Cardwallet object if the Cardwallet extension is not installed");

        if( Wallet._cardWalletInterface === undefined )
        {
        Wallet._cardWalletInterface = private_makeWalletInterface( Wallet.Names.Cardwallet );
        }
        
        return Wallet._cardWalletInterface;
    }

    static get Cardwallet()
    {
        if( !Wallet.has( Wallet.Names.Cardwallet ) ) throw new CardwalletError("can't access the Cardwallet object if the Cardwallet Wallet extension is not installed");
        if( !Wallet.isAviable( Wallet.Names.Cardwallet ) ) throw new CardwalletError("Wallet.enable( Wallet.Names.Cardwallet ) has never been called before, can't access the Cardwallet interface");

        if( Wallet._CardWalletWallet === undefined )
        {
        Wallet._CardWalletWallet = private_makeWallet( Wallet._cardWalletObj, Wallet._api_key )
        }

        return Wallet._CardWalletWallet;
    }

}













// ---------------------------------------------------- private --------------------------------------------------------- //

/**
 * 
 * @param {Wallet.WalletStringName} walletStringName member of the Wallet.Names bject which you can import by ```inport { Wallet.Names } from "@harmonicpool/cardano-wallet-interface"```
 * @returns {Wallet.WalletInterface}
1 */
function private_makeWalletInterface( walletStringName )
{
    // I know is private but I don't trust myself
    Wallet._assertBrowser();
    Wallet._assertWalletNameIsValid( walletStringName );

    function getApiVersion()
    {
        switch( walletStringName )
        {
        case Wallet.Names.Nami:              return window?.cardano?.nami?.apiVersion               ? window.cardano.nami.apiVersion : ""; 
        case Wallet.Names.CCVault:
        case Wallet.Names.Eternl:            return window?.cardano?.eternl?.apiVersion            ? window.cardano.eternl.apiVersion : "";  
        case Wallet.Names.Flint:             return window?.cardano?.flint?.apiVersion              ? window.cardano.flint.apiVersion : ""; 
        case Wallet.Names.Yoroi:             return window?.cardano?.yoroi?.apiVersion              ? window.cardano.yoroi.apiVersion : "";  
        case Wallet.Names.Gero:              return window?.cardano?.gerowallet?.apiVersion         ? window.cardano.gerowallet.apiVersion : "";
        case Wallet.Names.Typhon:            return window?.cardano?.typhon?.apiVersion             ? window.cardano.typhon.apiVersion : "";
        case Wallet.Names.Cardwallet:        return window?.cardano?.cardwallet?.apiVersion         ? window.cardano.cardwallet.apiVersion : "";
        
        default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }
    }

    function getName()
    {
        switch( walletStringName )
        {
            case Wallet.Names.Nami:              return window?.cardano?.nami?.name               ? window.cardano.nami.name : ""; 
            case Wallet.Names.CCVault:
            case Wallet.Names.Eternl:            return window?.cardano?.eternl?.name            ? window.cardano.eternl.name : "";  
            case Wallet.Names.Flint:             return window?.cardano?.flint?.name              ? window.cardano.flint.name : ""; 
            case Wallet.Names.Yoroi:             return window?.cardano?.yoroi?.name              ? window.cardano.yoroi.name : "";  
            case Wallet.Names.Gero:              return window?.cardano?.gerowallet?.name         ? window.cardano.gerowallet.name : "";
            case Wallet.Names.Typhon:            return window?.cardano?.typhon?.name             ? window.cardano.typhon.name : "";
            case Wallet.Names.Cardwallet:        return window?.cardano?.cardwallet?.name         ? window.cardano.cardwallet.name : "";

            default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }
  }

    function getIcon()
    {
        switch( walletStringName )
        {
            case Wallet.Names.Nami:              return window?.cardano?.nami?.icon               ? window.cardano.nami.icon : ""; 
            case Wallet.Names.CCVault:
            case Wallet.Names.Eternl:            return window?.cardano?.eternl?.icon            ? window.cardano.eternl.icon : "";  
            case Wallet.Names.Flint:             return window?.cardano?.flint?.icon              ? window.cardano.flint.icon : ""; 
            case Wallet.Names.Yoroi:             return window?.cardano?.yoroi?.icon              ? window.cardano.yoroi.icon : "";  
            case Wallet.Names.Gero:              return window?.cardano?.gerowallet?.icon         ? window.cardano.gerowallet.icon : "";
            case Wallet.Names.Typhon:            return window?.cardano?.typhon?.icon             ? window.cardano.typhon.icon : "";
            case Wallet.Names.Cardwallet:        return window?.cardano?.cardwallet?.icon         ? window.cardano.cardwallet.icon : "";
            
            default: throw new WalletProcessError("invalid argument; wallet name should be a member of the WalleName enumeration object")
        }
    }

    return {
        apiVersion: getApiVersion(),
        icon:       getIcon(),
        name:       getName(),
        isInjected: () => Wallet.has( walletStringName ),
        isAviable:  () => Wallet.isAviable( walletStringName ),
        isEnabled:  () => Wallet.isEnabled( walletStringName ),
        enable:     () => Wallet.enable( walletStringName )
    };

}

/**
 * 
 * @param {RawCip30} WalletProvider 
 * @param {string} defaultBlockfrost_api_key 
 * @returns {Wallet.Wallet}
 */
function private_makeWallet( WalletProvider, defaultBlockfrost_api_key )
{
    const getCurrentUserDelegation = async ( blockfrost_project_id = undefined ) =>
    {
        if( !(blockfrost_project_id || defaultBlockfrost_api_key) ) throw new NamiError("no blockfrost api key was provvided, please set a default one by calling Wallet.setBlockfrost or pass one as a parameter");

        if( typeof blockfrost_project_id !== "string" )
        {
        if( typeof defaultBlockfrost_api_key !== "string" ) throw new NamiError("no blockfrost api key is valid");

        return await private_getCurrentUserDelegation( WalletProvider, defaultBlockfrost_api_key )
        }
        else
        {
        return await private_getCurrentUserDelegation( WalletProvider, blockfrost_project_id )
        }
    }

    const createDelegagtionTransaction = async ( targetPoolId, blockfrost_project_id = undefined ) => {
        if( typeof targetPoolId !== "string" ) throw new StringFormatError("in order to delegate to a pool you must provvide a valid pool id string;  pool id was: " + targetPoolId );
        if( !targetPoolId.startsWith("pool") ) throw new StringFormatError("you must use the bech 32 pool id, perhaps you provvided the hex pool id? input was: " + targetPoolId );

        if( WalletProvider.name === "Typhon Wallet")
        {
        // Typhon specific
        const { status, data } = await window.cardano.typhon.delegationTransaction({
            poolId: targetPoolId
        })

        if( status === true )
        {
            return data.transactionId;
        }
        else
        {
            throw new TyphonError("delegation transaction rejected")
        }

        }

        return await private_delegationTransaction(
            blockfrost_project_id,
            WalletProvider,
            await getCurrentUserDelegation( blockfrost_project_id ),
            targetPoolId
        )
  };

    const signTransaction = async ( transactionToSign ) =>
    {
        return await private_signTransaction( WalletProvider, transactionToSign );
    }

    const submitTransaction = async ( signedTransaction ) =>
    {
        return await private_submitTransaction( WalletProvider, signedTransaction )
    }

    const signAndSubmitTransaction = async ( Transaction ) =>
    {
        return await submitTransaction(
        await signTransaction(
            Transaction
        )
        )
    }

    const delegateTo= async ( targetPoolId, blockfrost_project_id = undefined ) => 
    {
        return await submitTransaction(
            await signTransaction(
                await createDelegagtionTransaction(
                    targetPoolId,
                    blockfrost_project_id
                )
            )
        );
    }

    return {
        raw: WalletProvider,
        getCurrentUserDelegation,
        createDelegagtionTransaction,
        signTransaction,
        submitTransaction,
        signAndSubmitTransaction,
        getPoolId: private_getPoolId,
        delegateTo
    }
}

async function private_blockfrostRequest( blockfrost_project_id, endpoint, headers, body )
{
    if( typeof blockfrost_project_id !== "string" ) throw Error;

    return await fetch(
        `https://cardano-mainnet.blockfrost.io/api/v0` + endpoint,
        {
        headers: { project_id: blockfrost_project_id },
        }
    ).then((res) => res.json());
};


async function private_getProtocolParameters( blockfrost_project_id )
{
  if( typeof blockfrost_project_id !== "string" ) throw Error;

  // await Loader.load()

  const p = await private_blockfrostRequest( blockfrost_project_id,"/epochs/latest/parameters" );

    return {
        linearFee: LinearFee.new(
        BigNum.from_str(p.min_fee_a.toString()),
        BigNum.from_str(p.min_fee_b.toString())
        ),
        minUtxo: BigNum.from_str(p.min_utxo),
        poolDeposit: BigNum.from_str(p.pool_deposit),
        keyDeposit: BigNum.from_str(p.key_deposit),
        maxValueSize: p.max_val_size,
        maxTxSize: p.max_tx_size,
    };
};


function private_getPoolId( bech32_poolId )
{
    return Buffer.from(Ed25519KeyHash.from_bech32(bech32_poolId).to_bytes(), "hex").toString("hex")
}


async function private_getRewardAddress ( WalletProvider )
{
    const getRewardAddress =
    // nami || flint
    WalletProvider.getRewardAddress || 
    // CCVault
    WalletProvider.getRewardAddresses

    if( typeof getRewardAddress !== "function" )
    throw new WalletProcessError(
    "could not find reward address or addresses, probably this is not your fault and the package may need mainatainance, \
    please open an issue at https://github.com/HarmonicPool/cardano-wallet-interface/issues"
    );

    let rawAddress = await getRewardAddress();


    if( Array.isArray(rawAddress) )
    {
        rawAddress = rawAddress[0];
    }
    else if( typeof rawAddress === "object" )
    {
        // typhon
        rawAddress = rawAddress.data;
    }
    
    if( typeof rawAddress !== "string" )
    throw new WalletProcessError(
        "bad request for getting user reward address, probably not your fault, pleas open an issue explaining what appened here: https://github.com/HarmonicPool/cardano-wallet-interface/issues"
    );

    return rawAddress;
}

async function private_delegationTransaction( blockfrost_project_id, WalletProvider, delegation, targetPoolId)
{
  
  // await Loader.load();
  const protocolParameters = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0` + "/epochs/latest/parameters",
    {
      headers: { project_id: blockfrost_project_id },
    }
  ).then((res) => res.json());

  let address = (await WalletProvider.getUsedAddresses())[0];

  if( address === undefined )
  {
    throw new WalletProcessError("Seems like the user has no used addresses, please found the using wallet")
  }

  address = Address.from_bytes(Buffer.from(address, "hex"));

  const rewardAddress = await private_getRewardAddress( WalletProvider );

  const stakeCredential = RewardAddress.from_address(
    Address.from_bytes(Buffer.from(rewardAddress, "hex"))
  ).payment_cred();

  let utxos = await WalletProvider.getUtxos();

  utxos = utxos.map((utxo) =>
    TransactionUnspentOutput.from_bytes(Buffer.from(utxo, "hex"))
  );

  //estimated max multiasset size 5848
  //estimated max value size 5860
  //estimated max utxo size 5980
  const MULTIASSET_SIZE = 5848;
  const VALUE_SIZE = 5860;

  const UTxOs = TransactionUnspentOutputs.new()

  utxos.forEach( u => UTxOs.add(u) );

  //const inputs = selection.input;
  let txBuilderConfig = TransactionBuilderConfigBuilder.new();

  txBuilderConfig = txBuilderConfig.coins_per_utxo_word(
    BigNum.from_str(protocolParameters.coins_per_utxo_word)
  );

  txBuilderConfig = txBuilderConfig.fee_algo(
    LinearFee.new(
      BigNum.from_str(protocolParameters.min_fee_a.toString()) ,
      BigNum.from_str(protocolParameters.min_fee_b.toString())
    )
  );

  txBuilderConfig = txBuilderConfig.key_deposit(BigNum.from_str(protocolParameters.key_deposit))

  txBuilderConfig = txBuilderConfig.pool_deposit(
    BigNum.from_str(protocolParameters.pool_deposit)
  );

  txBuilderConfig = txBuilderConfig.max_tx_size( parseInt( protocolParameters.max_tx_size ) );

  txBuilderConfig = txBuilderConfig.max_value_size( parseInt(protocolParameters.max_val_size) );

  txBuilderConfig = txBuilderConfig.prefer_pure_change(true);

  txBuilderConfig = txBuilderConfig.build();


const txBuilder = TransactionBuilder.new(txBuilderConfig);

txBuilder.add_inputs_from( UTxOs, CoinSelectionStrategyCIP2.RandomImprove );

  const certificates = Certificates.new();
  if (!delegation.active)
    certificates.add(
      Certificate.new_stake_registration(
        StakeRegistration.new(stakeCredential)
      )
    );

  certificates.add(
    Certificate.new_stake_delegation(
      StakeDelegation.new(
        stakeCredential,
        Ed25519KeyHash.from_bech32(targetPoolId)
      )
    )
  );
  txBuilder.set_certs(certificates);

  txBuilder.add_change_if_needed(address);

  const transaction = _Transaction.new(
    txBuilder.build(),
    TransactionWitnessSet.new()
  );

  const size = transaction.to_bytes().length * 2;
  if (size > protocolParameters.maxTxSize) throw ERROR.txTooBig;

  return transaction;
};

async function private_signTransaction( WalletProvider, transactionObj )
{
    // await Loader.load();

    // the transaction is signed ( by the witnesess )
    return await _Transaction.new(
        transactionObj.body(),
        // get witnesses object
        TransactionWitnessSet.from_bytes(
            Buffer.from(
                // gets witnesses
                await WalletProvider.signTx(
                    Buffer.from(transactionObj.to_bytes(), "hex").toString("hex")
                ),
                "hex"
            )
        )
    );
};

/**
 * 
 * @param {object} WalletProvider an object respecting the CIP30 dApp connector interface 
 * @param {Transaction} signedTransaction 
 * @returns {string} the transaction has you can use to check transaction status
 */
async function private_submitTransaction( WalletProvider, signedTransaction )
{
  // returns the transaction hash
  return await WalletProvider.submitTx(
    Buffer.from( signedTransaction.to_bytes(), "hex").toString("hex")
  );
};

async function private_getRewardAddress_bech32( WalletProvider )
{
  return await Address.from_bytes(
    Buffer.from( await private_getRewardAddress( WalletProvider ), "hex")
  ).to_bech32();
}

async function private_getCurrentUserDelegation( WalletProvider, blockfrost_project_id ){
  // await Loader.load();

  const rewardAddress = await private_getRewardAddress_bech32( WalletProvider );

  const stake = await private_blockfrostRequest( blockfrost_project_id, `/accounts/${rewardAddress}`);

  if (!stake || stake.error || !stake.pool_id) return {};

  return stake;
};

// exports default
export default Wallet;


const geroWalletFriendlyDomains = [
  "3air.io",
  "aada.finance",
  "ada-quest.com",
  "adadomains.io",
  "adafinance.io",
  "adahandle.com",
  "adalend.finance",
  "adanft.app",
  "adanize.com",
  "adapay.finance",
  "adaswap.app",
  "adatokenizer.io",
  "adax.pro",
  "adazine.com",
  "adazoo.com",
  "ardana.org",
  "artano.io",
  "artifct.app",
  "astarter.io",
  "bearsclub.io",
  "beyondrockets.city",
  "bingochain.io",
  "bondly.finance",
  "canucks-publishing.com",
  "cardahub.io",
  "cardano4speed.com",
  "cardanotales.com",
  "cardanowarriors.io",
  "cardax.io",
  "cardingo.io",
  "cardstarter.io",
  "centaurify.com",
  "charli3.io",
  "chibidangoheroes.com",
  "cnft.io",
  "cnft.tools",
  "coinlink.finance",
  "cornucopias.io",
  "coti.io",
  "credefi.finance",
  "cryptodino.io",
  "dcspark.io",
  "defire.fi",
  "do.exchange",
  "don-key.finance",
  "dracards.com",
  "dripdropz.io",
  "drunkendragon.games",
  "duelistking.com",
  "empowa.io",
  "ergodex.io",
  "everlens.io",
  "flur.ee",
  "gada.finance",
  "galactico.app",
  "galaxyof.art",
  "gamingcardano.com",
  "genesishouse.io",
  "geniusyield.co",
  "hashguardians.io",
  "husky-swap.io",
  "indigoprotocol.io",
  "jpg.store",
  "kick.io",
  "koios.rest",
  "kubecoin.org",
  "lilgoats.io",
  "liqwid.finance",
  "liqwid.finance",
  "lovada.art",
  "maladex.com",
  "martify.io",
  "matrixswap.io",
  "matrixswap.io",
  "mechverse.co",
  "meld.com",
  "meowswap.fi",
  "meowswap.fi",
  "minswap.org",
  "mirqur.io",
  "muesliswap.com",
  "myhomeplanet.io",
  "nexo.io",
  "nftjam.io",
  "optim.finance",
  "paribus.io",
  "pavia.io",
  "payment.nft-maker.io",
  "pixellinks.golf",
  "planetpalz.io",
  "playermint.com",
  "raynetwork.io",
  "ridotto.io",
  "rraayy.com",
  "scatdao.com",
  "spacetimemeta.io",
  "spinada.cash",
  "sundaeswap.finance",
  "tangocrypto.com",
  "theos.fi",
  "tokhun.io",
  "txgalactic.io",
  "vyfi.io",
  "wayacollective.com",
  "worldmobile.io",
  "worldofpirates.io",
]
