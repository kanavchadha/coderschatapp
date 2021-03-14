import React from 'react';
import Stories from 'react-insta-stories';
import { Modal } from 'antd';

const def_stories = [
    {
        url: 'https://c4.wallpaperflare.com/wallpaper/470/96/902/lake-water-wallpaper-thumb.jpg',
        type: 'image',
        header: {
            heading: 'Kanav Chadha',
            subheading: 'sub heading'
        },
    }, {
        url: 'https://i.pinimg.com/736x/0b/e6/02/0be602f4b1bfa9eb215505d0386b7f72.jpg',
        type: 'image',
        header: {
            heading: 'Kanav Chadha',
            subheading: 'sub heading'
        },
    },
    {
        url: 'https://media-exp1.licdn.com/dms/image/C4E1BAQF2qP4UX2ew6g/company-background_10000/0/1592947799882?e=2159024400&v=beta&t=I1nf2EICcc-HSKVyq1YjPRV6kqJgWOyiJZl87LRKSYc',
        type: 'image',
        header: {
            heading: 'Kanav Chadha',
            subheading: 'sub heading'
        },

    },
    {
        url: 'https://res.cloudinary.com/student-dev/video/upload/v1615112414/stories/lzmjv7blprtafdzwcui8.mp4',
        type: 'video',
        header: {
            heading: 'Kanav Chadha',
            subheading: 'sub heading'
        },

    }
]

const Status = (props) => {
    const {stories, showStory, onClose} = props;
    return (
        <Modal className="story" title={null} visible={showStory} onCancel={onClose} footer={null} centered width={356}>
            <Stories
                stories={stories}
                defaultInterval={2000}
                width={356}
                height={576}
                storyStyles={{
                    height: '100%',
                    width: '100%'
                }}
                onAllStoriesEnd={onClose}
            />
        </Modal>
    );
};

export default Status;