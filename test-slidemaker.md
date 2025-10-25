# Slidemaker Formatting Test

**Speaker Notes:** This is the title slide. Welcome everyone to the slidemaker test presentation.

## Test 1: Basic H2 with Subtitle
### This is a subtitle

* First bullet point
* Second bullet point
* Third bullet point

**Teaching Notes:** This slide demonstrates the basic H2 with H3 subtitle format. The subtitle should appear in italic below the heading.

## Test 2: H2 without Subtitle

* Just a headline
* With some bullets
* No subtitle here

**Notes:** Simple slide with no subtitle. Notice how bullets start closer to the headline when there's no subtitle.

## Test 3: H2 with H3 Subtitle
### H3 should become subtitle

* Testing subtitle detection
* After H2 heading
* Should work correctly

# Test 4: H1 as Content Slide
### H3 should become subtitle here too

* H1 can also have subtitles
* Using H3 immediately after
* Should not create separate slide

## Test 5: Multiple Bullets

* Bullet one
* Bullet two
* Bullet three
* Bullet four
* Bullet five
* Testing multiple items

## Test 6: Long Text Wrapping
### Testing header with very long text that should wrap to multiple lines

* Short bullet
* This is a very long bullet point that should test the text wrapping capabilities
* Another short one

**Speaker Notes:** This slide tests text wrapping in both the headline and bullet points.
Make sure to emphasize that long text should wrap properly.
This is a multi-line note to test that multi-line notes work correctly.

Two-Column: Basic Two Column

Left:
Left content line 1
Left content line 2
Left content line 3

Right:
Right content line 1
Right content line 2
Right content line 3

Two-Column: Two Column with Bullets

Left:
* Left bullet one
* Left bullet two
* Left bullet three

Right:
* Right bullet one
* Right bullet two
* Right bullet three

**Speaker Notes:** This two-column slide demonstrates how bullets can be distributed between left and right columns. Make sure both sides are balanced visually.

Two-Column: Asymmetric Content

Left:
* Lots of bullets
* On the left
* Multiple items
* Testing layout
* More items
* Even more

Right:
* Just a few
* On the right

## Test 7: H3 Standalone
### This H3 has no prior H2

* Should create its own slide
* Not be a subtitle
* Because no H2 before it

## Test 8: Empty Subtitle Test
### Just headline and subtitle

## Test 9: No Heading Test

* Starting with bullets
* No headline provided
* Should create "Untitled Slide"

## Test 10: Special Characters
### Testing "quotes" and 'apostrophes'

* Quote test: "hello world"
* Apostrophe test: it's working
* Ampersand: A & B
* Em dash: test — test

## Test 11: Single Image (Simple Syntax)

* Bullet point before image
* Testing image insertion
* Bullet point after

Image: https://picsum.photos/400/300

**Notes:** This slide tests a single image using the simple "Image: URL" syntax. The image should appear on the right side of the slide.

## Test 12: Single Image (Markdown Syntax)

* Testing markdown image format
* Image should appear on right
* Text should be on left

![Test Image](https://picsum.photos/400/300)

**Notes:** This slide uses markdown syntax ![alt](URL) for image insertion.

## Test 13: Multiple Images

* Testing multiple image support
* Images should stack vertically
* On the right side of slide

Image: https://picsum.photos/400/300
Image: https://picsum.photos/400/300?random=1

**Notes:** Two images should stack vertically on the right side. Bullet text should remain on the left with adjusted width.

## Test 14: Image with Long Text

* This is a longer bullet point to test how text wraps when images are present on the slide
* The bullet text area should be narrower to accommodate the image
* Font size should also be smaller (18pt instead of 20pt)
* Testing that all text remains readable

Image: https://picsum.photos/400/300

## Test 15: Image Only (No Bullets)
### Just an image with subtitle

Image: https://picsum.photos/400/300

**Notes:** This slide has no bullets, just a headline, subtitle, and image.

Two-Column: Images in Two-Column Layout

Left:
* Left column content
* With some bullets
* And an image below

Image: https://picsum.photos/300/200

Right:
* Right column content
* Also with bullets
* And its own image

Image: https://picsum.photos/300/200?random=2

**Notes:** Testing images in both columns of a two-column layout. Each column should have its own image positioned below the text.

## Test 16: Google Drive Image Test (GDRIVE)
### Using GDRIVE:fileId format

* To test this, replace the ID below with an actual Google Drive file ID
* Format is GDRIVE:yourFileIdHere
* Should work with any image in your Drive

Image: GDRIVE:REPLACE_WITH_YOUR_FILE_ID

**Notes:** Replace the file ID with an actual image from your Google Drive to test this feature.

## Test 17: Mixed Content

* Bullet point one
* Bullet point two
* Bullet point three

Image: https://picsum.photos/400/300

* More bullets after image
* Testing interleaved content
* Should all bullets combine

**Notes:** All bullets should appear together on the left, even if image syntax is in between. The image should be on the right.

## Test 18: Single Video

* Testing YouTube video insertion
* Video should appear on right
* Uses simple Video: syntax

Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

**Notes:** Single YouTube video should appear on the right side. Replace with any valid YouTube URL to test.

## Test 19: Multiple Videos

* Testing multiple video support
* Videos should stack vertically
* Both on right side

Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Video: https://youtu.be/9bZkp7q19f0

**Notes:** Two videos should stack vertically. Testing both youtube.com and youtu.be URL formats.

## Test 20: Video with Long Text

* This is a longer bullet point to test how text wraps when videos are present on the slide
* The bullet text area should be narrower to accommodate the video
* Font size should also be smaller (18pt instead of 20pt)
* All text should remain readable

Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

## Test 21: Video Only (No Bullets)
### Just a video with subtitle

Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

**Notes:** This slide has no bullets, just headline, subtitle, and video.

Two-Column: Videos in Two-Column Layout

Left:
* Left column content
* With some bullets
* And a video below

Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

Right:
* Right column content
* Also with bullets
* And its own video

Video: https://youtu.be/9bZkp7q19f0

**Notes:** Testing videos in both columns of a two-column layout. Each column should have its own video positioned below the text.

## Test 22: Mixed Media (Images and Videos)

* Testing both images and videos together
* Should stack vertically on right
* Images first, then videos

Image: https://picsum.photos/400/300
Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

**Notes:** Mixed media should stack in order: images first, then videos below them.

## Test 23: Multiple Mixed Media

* Complex media test
* Two images and two videos
* Should all stack vertically

Image: https://picsum.photos/400/300
Image: https://picsum.photos/400/300?random=1
Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Video: https://youtu.be/9bZkp7q19f0

**Notes:** All four media elements should stack on the right side in the order they appear.

Two-Column: Mixed Media in Columns

Left:
* Left column with mixed media
* Image and video together

Image: https://picsum.photos/300/200
Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

Right:
* Right column also mixed
* Video and image (reversed order)

Video: https://youtu.be/9bZkp7q19f0
Image: https://picsum.photos/300/200?random=2

**Notes:** Testing mixed media in both columns with different ordering.

# Final Slide
### End of All Tests

* Text formatting tested ✓
* Image functionality tested ✓
* Video functionality tested ✓
* Two-column layouts tested ✓
* All features working!
