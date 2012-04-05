// example of defining a token
//  create variables for each token, defined as unique non-empty strings
var PRE_TEXT="PRE_TEXT";  // default token
var NEW_LINE="NEW_LINE";
var UL="UL";
var OL="OL";
var DL="DL";
var ITEM_TEXT="ITEM_TEXT";
var HTML="HTML";

// main entry point when the user clicks save
function compile() {
    var inArea = document.getElementById('idtextarea');
    var outDiv = document.getElementById('iddiv');
    var dbgDiv = document.getElementById('iddebug');
    var inText;
    // get input text
    if (inArea.value) inText=inArea.value;
    else inText = inText.innerHTML;

    // do line parsing
    var outText = parseLines(inText);

    // display result, letting the browser interpret it as HTML
    outDiv.innerHTML = outText;

    // also display our raw HTML so we can see what we did
    if (dbgDiv.firstChild)
        dbgDiv.replaceChild(document.createTextNode(outText),dbgDiv.firstChild);
    else
        dbgDiv.appendChild(document.createTextNode(outText));
    return outText;
}

function generateListTokens(extractedText, tokens) {
  reUL = /^\*+/;  // Unordered list RE
  reOL = /^#+/;   // Ordered list RE
  reDL = /^\:+/;  // Definition list RE
  
  while (extractedText != "") {
    var listItem = "";
    if ((listItem = extractedText.match(reUL)) != null) {
      var newToken = new Object();
      newToken.type = UL;
      newToken.level = listItem[0].length;
      tokens.push(newToken);
      
      extractedText = extractedText.replace(reUL, "");
    } else if ((listItem = extractedText.match(reOL)) != null) {
      var newToken = new Object();
      newToken.type = OL;
      newToken.level = listItem[0].length;
      tokens.push(newToken);
      extractedText = extractedText.replace(reOL, "");
    } else if ((listItem = extractedText.match(reDL)) != null) {
      var newToken = new Object();
      newToken.type = DL;
      newToken.level = listItem[0].length;
      tokens.push(newToken);
      extractedText = extractedText.replace(reDL, "");
    } else {
      var newToken = new Object();
      newToken.type = ITEM_TEXT;
      // Remove whitespaces
      //extractedText = extractedText.replace(/\s$/,"");
      newToken.value = extractedText; 
      tokens.push(newToken);
      extractedText = "";
    }
  }
}

// within here you should parse the input string and return
// a string of raw HTML as output
function parseLines(inText) {
    //var tokens["NEW_LINE"] = "/\n\n/";
    //Process 
    reLists = /^[\**\:*#*]*[\*+\:*#*].*\n?/;
    rePreText =/^( +.*\n?)/;
    reNewLine=/^\n/;
    reHTML=/^([^\*\:#\n ].*\n?)+/;
    var tokens = [];
  while (inText != "") {
    var extractedText = "";
	  if ((extractedText = inText.match(reNewLine)) != null) {
	    // Generate blank line token
    	  var newToken = new Object();
    	  newToken.type = NEW_LINE;
    	  tokens.push(newToken);
	    inText=inText.replace(reNewLine, "");	  
	  } else if ((extractedText = inText.match(rePreText)) != null) {
	    //Gen pure text token
	    var newToken = new Object();
	    newToken.type = PRE_TEXT;
	    newToken.value = extractedText[0];
	    tokens.push(newToken);
	    inText=inText.replace(rePreText, "");	  
	  } else if ((extractedText = inText.match(reLists)) != null) {
	    // Generate lists token(s)
	    generateListTokens(extractedText[0], tokens);
	    inText=inText.replace(reLists, "");	  
	  } else if ((extractedText = inText.match(reHTML)) != null) {
	    var newToken = new Object();
	    newToken.type = HTML;
	    newToken.value = extractedText[0];
	    tokens.push(newToken);
        inText=inText.replace(reHTML, "");
	  }
  } 
  return parser(tokens);  

}

function closeLists() {
//  openUL;
//  openOL;
}

function emitPreText(token) {
  return "<PRE>" + token.value + "</PRE>";
}

function emitItemText(token) {
  return token.value;
}

function emitHTML(token) {
  return "<p>" + token.value + "</p>";
}

function emitLineBreak() {
  return "<br />";
}

function emitCloseLevels(token, levels) {
  if (!token)
    return "";
  var k = 0;
  var output = "";
  for (k=0; k < levels; k++) {
    switch (token.type) {
      case UL: output += "</LI></UL>"; break;
      case OL: output += "</LI></OL>"; break;
      case DL: output += "</DD></DL>"; break;
    }
  }
  return output;
}

function emitOpenLevels(token, levels) {
  var k = 0;
  var output = "";
  for (k=0; k < levels; k++) {
    switch (token.type) {
      case UL: output += "<UL><LI>"; break;
      case OL: output += "<OL><LI>"; break;
      case DL: output += "<DD><DL>"; break;
    }
  }
  return output;
}

function emitNewItem(token) {
  var output = "";
  switch (token.type) {
    case UL: 
    case OL: output += "<LI>"; break;
    case DL: output += "<DD>"; break;
  }
  return output;
}

function emitCloseItem(token) {
  var output = "";
  switch (token.type) {
    case UL: 
    case OL: output += "</LI>"; break;
    case DL: output += "</DD>"; break;
  }
  return output;
}

function emitFullList(listToken, itemToken) {
  var output = "";
  output += emitOpenLevels(listToken, listToken.level);
  output += emitItemText(itemToken);
  output += emitCloseLevels(listToken, listToken.level);
  return output;
}

function parser(tokenList) {
  var output = "";
  var i = 0;
  var openList = [];
  while ( i < tokenList.length) {
    switch (tokenList[i].type) {
      case PRE_TEXT: 
        output += emitCloseLevels(openList[0]);
        output += emitPreText(tokenList[i]);
        i++;
        break;      
      case HTML:
        output += emitCloseLevels(openList[0]);      
        output += emitHTML(tokenList[i]); 
        i++;
        break;
      case NEW_LINE: //Check for out-out-of-bounds undefined errors
        output += emitCloseLevels(openList[0]);
        if (tokenList[i+1].type === NEW_LINE) {
          output += emitLineBreak();
          i++; //We are skipping an element
        }
        i++;
        break;
      case UL: // Fall-through
      case OL: // Fall-through
      case DL:
       if (i > 0) {              
        // Is this a new list?   
            if (openList.length > 0 && (openList[0].type == tokenList[i].type)) { // This is already open
              var prev = openList.pop();
              if (prev.level == tokenList[i].level) { //current = previous
                output += emitCloseItem(tokenList[i]);
                output += emitNewItem(tokenList[i]);
              } else if (prev.level > tokenList[i].level) { //current < previous
                output += emitCloseLevels(prev, prev.level - tokenList[i].level);
                output += emitNewItem(tokenList[i]);
              } else { // current > previous
                output += emitOpenLevels(tokenList[i], tokenList[i].level - prev.level);
              }
            } else {
              output += emitOpenLevels(tokenList[i], tokenList[i].level);
            }
            openList.push(tokenList[i]);
            if (tokenList[i+1].type == ITEM_TEXT) {
              output += emitItemText(tokenList[i+1]);
              i++;
            }
            i++;                          
     } else {
       output += emitOpenLevels(tokenList[i], tokenList[i].level);
       openList.push(tokenList[i]);
       if (tokenList[i+1].type == ITEM_TEXT) {
         output += emitItemText(tokenList[i+1]);
         i++;
       }
       i++;
     }
      var listsToClose = [];         
      // If this token is part of a series of lists
      while ((tokenList[i-1].type === UL || tokenList[i-1].type === OL || tokenList[i-1].type === DL) && 
            (tokenList[i].type === UL || tokenList[i].type === OL || tokenList[i].type === DL)) {             
        // In this case generate a full List hierarchy for this token
        listsToClose.push(tokenList[i]);
        output += emitOpenLevels(tokenList[i], tokenList[i].level);
        i++;
      }

      if (i < tokenList.length) {
        if(tokenList[i].type == ITEM_TEXT) {
          output += emitItemText(tokenList[i]);
          i++;
        }
      }

      var j = 0;
      while (listsToClose.length > 0) {
        token = listsToClose.pop();
        output += emitCloseLevels(token, token.level);
      }
   } // Token type instruction
 } // While
 output += emitCloseLevels(openList[0], openList[0].level);
 return output;
} // Function
          
            
         
      
// This is the right way to write it :-)

/*
// Returns the parse tree
function generateParseTree(tokenList) {
  if (token[0].type == PRE_TEXT || token[0].type == NEW_LINE ||
      token[0].type == UL || token[0].type == OL || token[0].type == DL ||
      token[0].type == ITEM_TEXT || token[0].type == HTML) {      
    root = new Object();
    root.type = PROGRAM;
    root.children =[];
    element_list(tree, tokenList);
    match_token("");
  } else {
    //parse error - invalid input token
  }
  return root;
}

function statement_lst(currentNode, tokenList) {
  me = new Object();
  me.type = STATEMENT_LIST;
  currentNode.children.push(me);
  
  if (tokenList[0] == null) 
    return;  
  
  if (token[0].type == PRE_TEXT || token[0].type == NEW_LINE ||
      token[0].type == UL || token[0].type == OL || token[0].type == DL ||
      token[0].type == ITEM_TEXT || token[0].type == HTML) {
    statement(me, tokenList);
    statement_list(me, tokenList);
  } else {
    //parse error
  }
}

function statement(currentNode, tokenList) {
  me = new Object();
  me.type = STATEMENT;
  currentNode.children.push(me);
  
  if (tokenList[0] == null) 
    return;
  
  switch (token[0].type) {
    case PRE_TEXT: match_token(PRE_TEXT); break;
    case NEW_LINE: match_token(NEW_LINE); break;
    case 
    
    
    
*/
    
    
    
    
    
    
    
    
