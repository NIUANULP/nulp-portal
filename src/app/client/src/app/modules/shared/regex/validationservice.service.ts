import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Injectable({
providedIn: 'root'
})
export class ValidationserviceService {

constructor() { }
// lbhRegex:any=       "^((?!(0))[0-9]{1,7})$" or ^[+-]?(?=.?\d)\d*(\.\d{0,2})?$
lbhRegex:any=    /^([+-]?(?=.?[1-9])\d*(\.\d{2})?)$/
lbhRegexZero:any=   /^([+-]?(?=.?[0-9])\d*(\.\d{2})?)$/

blockRegex:any=    /^([+-]?(?=.?[1-9])\d*(\.\d{1,2})?)$/
blockRegexZero:any=   /^([+-]?(?=.?[0-9])\d*(\.\d{1,2})?)$/

areaRegex:any=  /^(([1-9]{1}[0-9]{0,6})|([1-9]{1}[0-9]{0,6}[.]{1}[0-9]{2}))$/
areaRegexZero:any=  /^(([0-9]{1,7})|([0-9]{1,7}[.]{1}[0-9]{2}))$/

// areaRegex:any=  /^([+-]?(?=.?[1-9])\d*(\.\d{2})?)$/
// areaRegexZero:any=  /^([+-]?(?=.?[0-9])\d*(\.\d{2})?)$/

prmoterlbh:any=   /^([+-]?(?=.?[0-9])\d*(\.\d{2})?)$/

fsiValidation:any =  /^[+-]?(?=.?\d)\d*(\.\d{0,2})?$/
devdtl:any=                  "^(([1-9]{1})|([1-9]{1}[0-9]{1,4}))*$"
panNoRegex:any    =      "[A-Z]{3}[P]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
panNoRegexSearch:any    =      "[A-Z]{5}[0-9]{4}[A-Z]{1}"
numberRegex:any   =      "^[1-9]{1}[0-9]{9}$"
promoterPanRegex:any = "[A-Z]{3}[P,C,H,A,B,J,T,F,G,L]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
landlaineRegex:any = "^[0-9]{10}$"
pinCodeRegex:any  =      "^[0-9]{6}$"
numRegex:any  =      "^(([0-9]{1})|([1-9]{1}[0-9]{1,4}))*$"
prPinCodeRegex:any  =      "^[0-9]{6}$"
mobRegex:any  =            "^[6,7,8,9]{1}[0-9]{9}$"
yearRegex:any=           "^[1-9]{1}[0-9]{3}$"
ICMAIRegex:any=           "^[1-9]{1}[0-9]{4}$"
ICMAIRegexCA:any=           "^[0-9]{6}$"
experienceRegex:any =     "^[0-9]{1,2}$"
experiencepromoterRegex:any = "^(([1-9]{1}[0-9]{1,2})|([1-9]{1}[0-9]{1,2}[.]{1}[0-9]{1,2}))$"
totalprojectRegex:any = "^[0-9]{1,3}$"
aadhaarRegex:any  =       "^[0-9]{12}$"
alphabetRegex:any =      "^[a-zA-Z]{2}[a-zA-Z ]*$"
middlealphaRegex:any =      "^[a-zA-Z ]*$"
docsAlphabetRegex:any =      "^[a-zA-Z]{1}[a-zA-Z ]*$"
alphabetWithoutSpaceRegex:any ="^[a-zA-Z]{2}[a-zA-Z]*$"
companyRegex:any =      "^[a-zA-Z]{2}[a-zA-Z&-,. ]*$"

twitterHandleRegex:any="(?<=^|(?<=[^a-zA-Z0-9-_\.]))@([A-Za-z]+[A-Za-z0-9-_]+)"
urlRegex:any = "^(((http:\/\/|https:\/\/|http:\/\/www.|https:\/\/www.|www.)[a-z]{2,50})[a-zA-Z0-9?=_#&\+-\.\/]*)$"



// facebookRegex:any = "^(((http:\/\/www.facebook.com/|https:\/\/www.facebook.com/)[a-z]{2,50})[a-zA-Z0-9?=_#&\+-\.\/]*)$"

youtubeRegex:any = "^(((http:\/\/www.youtube.com/embed/|https:\/\/www.youtube.com/embed/)[a-z]{2,50})[a-zA-Z0-9?=_#&\+-\.\/]*)$"
companyNameRegex:any= "^(?=(?:[^\A-Za-z0-9]*[\A-Za-z0-9]){2})[~,?,!]*\S+(?: \S+){0,}$"
spaceStartEndFalse:string = "^(([a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{1,4})|([a-zA-Z0-9/]([a-zA-Z0-9/ ]*)[a-zA-Z0-9/]))*$"

minmaxRegex:any   =      "^[0-9]{4,6}$"
stateBarRegex:any  =      "[A-Z]{1}[/]{1}[0-9]{1,6}[/]{1}[0-9]{1,6}"
ISCIRegex:any     =       "^[0-9]{5,5}$"
alphanumericRegex:any =  "^[a-zA-Z0-9/]*$"
alphanumericspaceRegex:any =  "^[a-zA-Z0-9 .&/]*$"
areaConstructedRegex:any =  "^([0-9]|[1-9]{1}[0-9.])*$"
caRegex:any =            "[C]{1}[A]{1}[/]{1}[0-9]{2,4}[/]{1}[0-9]{2,6}"
commaRegex:string = "^(([a-zA-Z][a-zA-Z_@#/:().+]*)([,][a-zA-Z][a-zA-Z_@#/:().+]*)*)$"
revenueCommaRegex:string = "^(([a-zA-Z0-9][a-zA-Z0-9_@#/:().+]*)([,][a-zA-Z0-9][a-zA-Z0-9_@/#:().+]*)*)$"
addresRegex:string="^(([a-zA-Z0-9][a-zA-Z0-9 ]*)([,-@/#:().+!%][a-zA-Z0-9][a-zA-Z0-9 ]*)*)$"
// caRegex:any =            "[C]{1}[A]{1}[/]{1}[0-9]{4}[/]{1}[0-9]{6}[C]{1}[A]{1}[/]{1}[0-9]{4}[/]{1}[0-9]{4,6}"
copRegex:any=            "[C]{1}[O]{1}[P]{1}[/]{1}[0-9]{4}[/]{1}[0-9]{6}"

cinRegex:any=              "[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}"
alphanumRegex:any =          "^[a-zA-Z0-9]*$"
rofRegex:any=               "[G]{1}[U]{1}[J]{1}[A-Z]{2}[0-9]{6}"
llpinRegex:any =             "[A-Z]{3}[0-9]{4}"
//ifscRegex:any =             "[A-Z]{4}[0-9]{7}"
ifscRegex:any =             "[A-Z]{4}[0]{1}[0-9A-Z]{6}"
ifscRegex1:any =             "[a-zA-Z]{4}[0-9]{7}"
companyPanRegex:any    =      "[A-Z]{3}[C]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
partnerReegex:any=                   "^[a-zA-Z0-9]*$"
hufRegex:any    =      "[A-Z]{3}[H]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
aopRegex:any    =      "[A-Z]{3}[A]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
boiRegex:any    =      "[A-Z]{3}[B]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
ajpRegex:any    =      "[A-Z]{3}[J]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
mobileno:any  =   "[6-9]\\d{9}"
trustRegex:any    =      "[A-Z]{3}[T]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
llpRegex:any    =      "[A-Z]{3}[F]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
compotentRegex:any    =      "[A-Z]{3}[G,L]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
AlphaNumericComma:any    =      "^[a-zA-Z0-9,]*$"
onlyNumberRegex:any    =      "[1-9]{1}[0-9]*$"
numberKeyRegex:any    =      "[0-9]*$"
alphaNumWithSpaceRegex:any =  "^[a-zA-Z0-9]{2}[a-zA-Z0-9 ]*$"
emailRegex:string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{1,4}$"
multiEmailRegex:string = "^([a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{1,4},?)+$"
accountNumber :any = "^[0-9]{9,16}$"
AllpanNoRegex:any    =      "[A-Z]{3}[A-Z]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}"
UDInumRegex:any =          "^[0-9]{6}[A-Z]{1}$"
alphanumericmultiplecharRegex:any =  "^[a-zA-Z0-9]{1}[a-zA-Z0-9 @~`!@#$%^&*()_=+\\\\';:\"\\/?>.<,-{|}[\\\]]*$"
alphanumericnospacecharRegex:any =   "^[a-zA-Z0-9@~`!@#$%^&*()_=+\\\\';:\"\\/?>.<,-{|}[\\\]]*$"
numericmultiplecharRegex:any =  "^[0-9]{1}[0-9 @~`!@#$%^&*()_=+\\\\';:\"\\/?>.<,-{|}[\\\]]*$"
alphamultiplecharRegex:any =  "^[a-zA-Z]{1}[a-zA-Z @~`!@#$%^&*()_=+\\\\';:\"\\/?>.<,-{|}[\\\]]*$"
tpNameRegex:any= "[a-zA-Z @~`!@#$%^&*()_=+\\\\';:\"\\/?>.<,-{|}[\\\]]*$"
alphamultiplecharcmsRegex:any =  "^[A-Za-z0-9_./-]*$"
numberDecimal:string = "^([0-9]*)[.]{1}([0-9]*)$"
numberTwoDecimal:string = "^(([0-9]{1,2})|([0-9]{1,2}[.]{1}[0-9]{1,2})*)$"
numberMaxFiveHundred:string = "^0*([1-9]|[1-8][0-9]|9[0-9]|[1-4][0-9]{2}|500)$"
numberMaxTenLakh:string = "^0*([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-8][0-9]{4}|9[0-8][0-9]{3}|99[0-8][0-9]{2}|999[0-8][0-9]|9999[0-9]|[1-8][0-9]{5}|9[0-8][0-9]{4}|99[0-8][0-9]{3}|999[0-8][0-9]{2}|9999[0-8][0-9]|99999[0-9]|1000000)$"
commaEmailRegex:string = "^(([a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4})([,][a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4})*)$"
commaMobileRegex:string = "^(([6-9]{1}[0-9]{9})([,][6-9]{1}[0-9]{9})*)$"

yesNAvalidationRegex:string = "(Y|NA)$"
noNAvalidationRegex:string = "(N|NA)$"
firmRegNo:string = "[0-9]{6}[a-zA-Z]{1}"

AlphaNumericCAgent:any    =   "^[ A-Za-z0-9\\//./()-]*$"

profileImageDimension:any =[100,100]
docsProjectImageDimension:any=[1050,435]
previousImageDimension:any =[225,200]
thumbnailPic : any = [350,145]
newsPic : any = [1025,200]


}
