txtrst=$(tput sgr0) # Text reset
txtyel=$(tput setaf 7) # Yellow
txtgrn=$(tput setaf 6) # Green
txtred=$(tput setaf 9) # red
echo ${txtred} Running grunt....
echo ${txtrst}
grunt
echo ${txtyel} Finished grunt process
echo ${txtred} Copying docs to Developer Docs directories....
echo ${txtyel} Copying api docs to Video Cloud docs....
cp -R docs/api/ ../BCL-developer-docs/en/video-cloud/brightcove-player/reference/api/
echo ${txtyel} Copying api docs to Perform docs....
cp -R docs/api/ ../BCL-developer-docs/en/perform/brightcove-player/reference/api/
echo ${txtgrn} Finished!
echo ${txtrst}