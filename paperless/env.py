flashDirectories = [
    "/home/ec2-user/paperless/inbox"
]

inboxDirectory = "/home/ec2-user/paperless/inbox"
imageStorageDirectory = "/home/ec2-user/paperless/images"

from os.path import dirname, join
MYDIR = join( dirname( __file__ ), '..' )

import pymongo
papers = pymongo.MongoClient()['paperless']['papers']
tagSentences = pymongo.MongoClient()['paperless']['tagSentences']
