package com.example.myteam.write;

import com.example.myteam.command.ProjectVO;
import com.example.myteam.command.UserVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class WriteController {

    @Autowired
    private WriteService writeService;

    @PostMapping("/{id}")
    public int createProject(@PathVariable("id") int id, @RequestBody ProjectVO vo) {
        return writeService.createProject(vo, id);
    }

    @GetMapping("/users/search")
    public List<UserVO> searchUsers(@RequestParam("query") String query) {
        return writeService.searchUsers(query);
    }

    @GetMapping("/users")
    public List<UserVO> getAllUsers() {
        return writeService.getAllUsers();
    }
}