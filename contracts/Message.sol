// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Message {
 
    string public message;
 
    constructor(){
        message="Hello World";
    }
 
    function setMessage(string memory _newMessage) public {
        message=_newMessage;
    }
 
    function getMessage() public view returns(string memory){
        return message;
    }  
}
